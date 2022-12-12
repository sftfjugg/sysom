import os
import json
import time
import logging
import requests
import threading

from django.conf import settings
from apps.migration.models import MigImpModel, MigJobModel
from lib.base_view import CommonModelViewSet
from lib.response import success, other_response, not_found, ErrorResponse
from lib.channel import sync_job, async_job, send_file, get_file
from lib.script import run_script, run_script_ignore, init_info_script, deploy_tools_script, backup_script, mig_ass_script, mig_imp_script, restore_script

logger = logging.getLogger(__name__)


class MigImpView(CommonModelViewSet):
    queryset = MigImpModel.objects.all()

    def get_group(self, request):
        group_url = f'{settings.SYSOM_API_URL}/api/v1/cluster/'
        res = requests.get(group_url)
        if res.status_code == 200:
            return success(result=res.json().get('data', []))
        else:
            return success()


    def get_group_list(self, request):
        group_id = request.GET.get('id')
        host_url = f'{settings.SYSOM_API_URL}/api/v1/host/?cluster={group_id}'
        res = requests.get(host_url)
        if res.status_code == 200:
            host_list = res.json().get('data', [])
            result = []
            for i in host_list:
                ip = i.get('ip')
                mig_imp = MigImpModel.objects.filter(ip=ip).values('id', 'ip', 'status', 'step', 'detail', 'rate', 'old_ver', 'new_ver').first()
                if not mig_imp:
                    MigImpModel.objects.create(**dict(ip=ip))
                    mig_imp = MigImpModel.objects.filter(ip=ip).values('id', 'ip', 'status', 'step', 'detail', 'rate', 'old_ver', 'new_ver').first()
                result.append(mig_imp)
            return success(result=result)
        else:
            return success()


    def get_host_info(self, request):
        host_ip = request.GET.get('ip')
        mig_imp = MigImpModel.objects.filter(ip=host_ip).first()
        if mig_imp and mig_imp.new_info:
            return success(result=json.loads(mig_imp.new_info))
        else:
            code, msg, data = self.init_info(mig_imp)
            return success(code=code, msg=msg, result=data)


    def init_info(self, mig_imp):
        if not mig_imp:
            return 200, 'success', None
        result, _ = sync_job(mig_imp.ip, run_script(init_info_script))
        if result.code == 0:
            info = dict()
            for i in result.result.splitlines():
                key, value = i.split(':')
                tmp = []
                for j in value.split(','):
                    t = j.split('=')
                    tmp.append(dict(name=t[0], value=t[1]))
                    if t[0] == '操作系统版本':
                        mig_imp.old_ver = t[1]
                info[key] = tmp

            mig_imp.new_info = json.dumps(info)
            if not mig_imp.old_info:
                mig_imp.old_info = json.dumps(info)
            mig_imp.save()
            return 200, 'success', info
        else:
            return 400, result.err_msg, None


    def get_host_mig(self, request):
        host_ip = request.GET.get('ip')
        mig_imp = MigImpModel.objects.filter(ip=host_ip).first()
        if mig_imp:
            res = dict()
            if mig_imp.mig_info:
                res.update(json.loads(mig_imp.mig_info))
            if mig_imp.mig_step:
                res.update(json.loads(mig_imp.mig_step))
            return success(result=res)
        else:
            return success()


    def get_host_log(self, request):
        host_ip = request.GET.get('ip')
        mig_imp = MigImpModel.objects.filter(ip=host_ip).first()
        if mig_imp:
            res = dict(
                ass_log = mig_imp.ass_log,
                ass_report = mig_imp.ass_report,
                imp_log = mig_imp.imp_log,
                imp_report = mig_imp.imp_report
            )
            return success(result=res)
        else:
            return success()


    def post_host_migrate(self, request):
        res = self.require_param_validate(request, ['step', 'ip'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        step = request.data.get('step')
        ip = request.data.get('ip')
        steps = {
            '0': self.mig_config,
            '1': self.mig_deploy,
            '2': self.mig_backup,
            '3': self.mig_ass,
            '4': self.mig_imp,
            '5': self.mig_reboot,
            '101': self.mig_restore,
            '102': self.mig_init,
        }

        err = []
        for i in ip:
            mig_imp = MigImpModel.objects.filter(ip=i).first()
            if not mig_imp:
                err.append(f'主机{i}尚未初始化。')
                continue
            if mig_imp.status in ['running', 'success', 'unsupported']:
                err.append(f'主机{i}当前状态无法进行此操作。')
                continue
            if step < 101 and mig_imp.step != step:
                err.append(f'主机{i}无法执行此步骤，请按序执行。')
                continue
            res = steps[str(step)](mig_imp, request.data)
            if res:
                err.append(res)
        if err:
            return success(code=400, msg='\n'.join(err))
        return success()


    def get_mig_step(self, step, flag):
        steps = [
            '实施配置',
            '环境准备',
            '系统备份',
            '迁移评估',
            '迁移实施',
            '重启机器',
        ]
        res = []
        for k,v in enumerate(steps):
            if k < step:
                res.append(dict(name=v, value='成功'))
            if k == step:
                if flag:
                    res.append(dict(name=v, value='成功'))
                else:
                    res.append(dict(name=v, value='失败'))
            if k > step:
                res.append(dict(name=v, value='未完成'))
        return dict(migration_step=res)


    def mig_config(self, mig_imp, data):
        if not mig_imp.old_ver:
            self.init_info(mig_imp)

        info = []
        info.append(dict(name='系统版本', value=mig_imp.old_ver))
        info.append(dict(name='迁移版本', value=data.get('version')))
        info.append(dict(name='迁移内核', value=data.get('kernel')))
        if data.get('repo_type') == 'public':
            info.append(dict(name='repo类型', value='公网地址'))
        else:
            info.append(dict(name='repo类型', value='内网地址'))
            info.append(dict(name='repo地址', value=data.get('repo_url')))
        if data.get('backup_type') == 'nfs':
            info.append(dict(name='备份类型', value='NFS备份'))
            info.append(dict(name='NFS地址', value=data.get('backup_url')))
            info.append(dict(name='备份路径', value=data.get('backup_pwd')))
            info.append(dict(name='备份目录', value=data.get('backup_dir')))
        else:
            info.append(dict(name='备份类型', value='不备份'))
        mig_imp.mig_info = json.dumps(dict(migration_info=info))
        mig_imp.new_ver = data.get('version')
        mig_imp.config = json.dumps(data)
        mig_imp.status = 'running'
        mig_imp.detail = ''
        mig_imp.save()

        if 'CentOS Linux 7' not in mig_imp.old_ver:
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
            mig_imp.status = 'unsupported'
            mig_imp.detail = f'不支持主机{mig_imp.ip}的操作系统版本进行迁移。'
            mig_imp.save()
            return mig_imp.detail
        else:
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
            mig_imp.status = 'pending'
            mig_imp.detail = '请执行下一步'
            mig_imp.step += 1
            mig_imp.save()
            return


    def mig_deploy(self, mig_imp, data):
        config = json.loads(mig_imp.config)
        repo_url = config.get('repo_url')
        if not repo_url:
            repo_url = settings.MIG_PUBLIC_URL
        
        cmd = run_script_ignore(deploy_tools_script.replace('REPO_URL', repo_url))
        self.run_async_job(mig_imp, 'mig_deploy', cmd)
        return


    def mig_backup(self, mig_imp, data):
        config = json.loads(mig_imp.config)
        backup_type = config.get('backup_type')
        if backup_type != 'nfs':
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
            mig_imp.status = 'pending'
            mig_imp.detail = '请执行下一步'
            mig_imp.step += 1
            mig_imp.save()
            return
        
        cmd = run_script(backup_script)
        self.run_async_job(mig_imp, 'mig_backup', cmd, timeout=3600000)
        return


    def mig_ass(self, mig_imp, data):
        ass_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
        ass_file = os.path.join(ass_path, 'mig_ass_log.log')

        cmd = run_script_ignore(mig_ass_script.replace('REPLACE_DIR', ass_path).replace('REPLACE_FILE', ass_file))
        mig_job = self.run_async_job(mig_imp, 'mig_ass', cmd, timeout=3600000)
        threading.Thread(target=self.get_log_report, args=(mig_imp, 'mig_ass_log', mig_job)).start()
        return


    def mig_imp(self, mig_imp, data):
        imp_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
        imp_file = os.path.join(imp_path, 'mig_imp_log.log')

        cmd = run_script_ignore(mig_imp_script.replace('REPLACE_DIR', imp_path).replace('REPLACE_FILE', imp_file))
        mig_job = self.run_async_job(mig_imp, 'mig_imp', cmd, timeout=3600000)
        threading.Thread(target=self.get_log_report, args=(mig_imp, 'mig_imp_log', mig_job)).start()
        return


    def mig_reboot(self, mig_imp, data):
        sync_job(mig_imp.ip, 'reboot')
        mig_imp.status = 'running'
        mig_imp.detail = ''
        mig_imp.save()
        threading.Thread(target=self.run_reboot_job, args=(mig_imp, )).start()
        return


    def mig_restore(self, mig_imp, data):
        config = json.loads(mig_imp.config)
        backup_type = config.get('backup_type')
        if backup_type != 'nfs':
            return f'主机{mig_imp.ip}没有配置备份方案，无法还原.'

        cmd = run_script(restore_script)
        async_job(mig_imp.ip, cmd, echo=dict(), timeout=60000)
        return


    def mig_init(self, mig_imp, data):
        MigImpModel.objects.create(**dict(ip=mig_imp.ip))
        return


    def run_async_job(self, mig_imp, job_name, cmd, timeout=600000):
        mig_job = MigJobModel.objects.create(**dict(ip=mig_imp.ip, mig_id=mig_imp.id, mig_type='imp', job_name=job_name))
        def finish(result):
            job_id = result.echo.get('mig_job_id')
            mig_ip = result.echo.get('mig_ip')
            mig_imp = MigImpModel.objects.filter(ip=mig_ip).first()
            mig_job = MigJobModel.objects.filter(id=job_id).first()
            mig_job.job_result = json.dumps(result.__dict__)
            if result.code == 0:
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
                mig_imp.status = 'pending'
                mig_imp.detail = '请执行下一步'
                mig_imp.step += 1
                mig_job.job_status = 'success'
            else:
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
                mig_imp.status = 'fail'
                mig_imp.detail = result.result
                mig_job.job_status = 'fail'
            mig_imp.save()
            mig_job.save()

        mig_imp.status = 'running'
        mig_imp.detail = ''
        mig_imp.save()
        echo = dict(mig_job_id=mig_job.id, mig_ip = mig_imp.ip)
        res = async_job(mig_imp.ip, cmd, echo=echo, timeout=timeout, finish=finish)
        mig_job.job_data = json.dumps(res)
        mig_job.save()
        return mig_job


    def get_log_report(self, mig_imp, job_name, main_job):
        MigJobModel.objects.create(**dict(ip=mig_imp.ip, mig_id=mig_imp.id, mig_type='imp', job_name=job_name))
        while True:
            time.sleep(5)
            imp_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
            if not os.path.exists(imp_path):
                os.makedirs(imp_path)

            if job_name == 'mig_ass_log':
                log_file = os.path.join(imp_path, 'mig_ass_log.log')
                mig_log = get_file(mig_imp.ip, log_file, log_file)
                if mig_log.code == 0:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        p = f.read()
                    mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                    mig_imp.ass_log = p
                    mig_imp.save()

                report_file = os.path.join(imp_path, 'mig_ass_report.log')
                mig_report = get_file(mig_imp.ip, report_file, settings.MIG_ASS_REPORT)
                if mig_report.code == 0:
                    with open(report_file, 'r', encoding='utf-8') as f:
                        p = f.read()
                    mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                    mig_imp.ass_report = p
                    mig_imp.save()
            
            if job_name == 'mig_imp_log':
                log_file = os.path.join(imp_path, 'mig_imp_log.log')
                mig_log = get_file(mig_imp.ip, log_file, log_file)
                if mig_log.code == 0:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        p = f.read()
                    mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                    mig_imp.imp_log = p
                    mig_imp.save()

                report_file = os.path.join(imp_path, 'mig_imp_report.log')
                mig_report = get_file(mig_imp.ip, report_file, settings.MIG_IMP_REPORT)
                if mig_report.code == 0:
                    with open(report_file, 'r', encoding='utf-8') as f:
                        p = f.read()
                    mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                    mig_imp.imp_report = p
                    mig_imp.save()

            rate_file = os.path.join(imp_path, 'mig_imp_rate.log')
            mig_rate = get_file(mig_imp.ip, rate_file, settings.MIG_IMP_RATE)
            if mig_rate.code == 0:
                with open(rate_file, 'r', encoding='utf-8') as f:
                    p = f.read()
                rate = json.loads(p).get('Progress', 0)
                rate = 100 if rate >= 100 else rate
                mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                mig_imp.rate = rate
                mig_imp.save()
            else:
                rate = 0

            mig_job = MigJobModel.objects.filter(ip=mig_imp.ip, mig_id=mig_imp.id, job_name=job_name).first()
            if rate >= 100:
                mig_job.job_status = 'success'
                mig_imp.save()
                break
            if main_job.job_status != 'running':
                mig_job.job_status = main_job.job_status
                mig_imp.save()
                break


    def run_reboot_job(self, mig_imp):
        flag = False
        i = 0
        while i < 60:
            i += 1
            time.sleep(15)
            result, _ = sync_job(mig_imp.ip, 'cat /etc/os-release')
            if result.code == 0 and 'Anolis OS' in result.result:
                flag = True
                break

        imp_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
        if not os.path.exists(imp_path):
            os.makedirs(imp_path)

        rate_file = os.path.join(imp_path, 'mig_imp_rate.log')
        mig_rate = get_file(mig_imp.ip, rate_file, settings.MIG_IMP_RATE)
        if mig_rate.code == 0:
            with open(rate_file, 'r', encoding='utf-8') as f:
                p = f.read()
            rate = json.loads(p).get('Progress', 0)
            rate = 100 if rate >= 100 else rate
            mig_imp.rate = rate

        if flag:
            self.init_info(mig_imp)
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
            mig_imp.status = 'success'
            mig_imp.detail = '迁移完成'
            mig_imp.step += 1
        else:
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
            mig_imp.status = 'fail'
            mig_imp.detail = '重启失败'
        mig_imp.save()
