import os
import csv
import json
import time
import random
import tarfile
import logging
import requests
import threading

from django.conf import settings
from apps.migration.models import MigAssModel, MigImpModel, MigJobModel
from lib.base_view import CommonModelViewSet
from lib.response import success, other_response, not_found, ErrorResponse
from lib.channel import sync_job, async_job, send_file, get_file
from lib.script import run_script, run_script_ignore, init_ance_script, ass_imp_script, ass_sys_script, ass_hard_script, ass_app_script, init_info_script, deploy_tools_script, backup_script, mig_ass_script, mig_imp_script, restore_script

logger = logging.getLogger(__name__)


class MigAssView(CommonModelViewSet):
    queryset = MigImpModel.objects.all()

    def get_host(self, request):
        host_url = f'{settings.SYSOM_API_URL}/api/v1/host/'
        res = requests.get(host_url)
        if res.status_code == 200:
            return success(result=res.json().get('data', []))
        else:
            return success()


    def get_ass_list(self, request):
        mig_ass = MigAssModel.objects.values('id', 'created_at', 'hostname', 'ip', 'old_ver', 'new_ver', 'rate', 'status', 'detail', 'config')
        return success(result=mig_ass)


    def read_csv(self, csv_path):
        result = None
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                result = [i for i in csv_reader]
        return result


    def get_ass_imp(self, request):
        ass_id = request.GET.get('id')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.imp_report:
            return success(result=json.loads(mig_ass.imp_report))
        else:
            return success()


    def get_ass_sys(self, request):
        ass_id = request.GET.get('id')
        ass_type = request.GET.get('type')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.sys_config:
            if ass_type:
                sys_file = json.loads(mig_ass.sys_config).get(ass_type, '')
                return success(result=self.read_csv(sys_file))
            else:
                result = json.loads(mig_ass.sys_config).keys()
                return success(result=result)
        else:
            return success()


    def get_ass_hard(self, request):
        ass_id = request.GET.get('id')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass:
            res = dict()
            if mig_ass.hard_info:
                res.update(dict(hard_info=json.loads(mig_ass.hard_info)))
            if mig_ass.hard_result:
                res.update(dict(hard_result=json.loads(mig_ass.hard_result)))
            return success(result=res)
        else:
            return success()


    def get_ass_app(self, request):
        ass_id = request.GET.get('id')
        rpm_name = request.GET.get('rpm_name')
        abi_name = request.GET.get('abi_name')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.app_config:
            rpm_path = json.loads(mig_ass.app_config).get(rpm_name, '')
            if abi_name:
                abi_name = os.path.basename(abi_name)
                for i in os.listdir(rpm_path):
                    if f'dep_require({abi_name})' in i:
                        abi_file = os.path.join(rpm_path, i)
                        return success(result=self.read_csv(abi_file))
                return success()
            if rpm_name:
                for i in os.listdir(rpm_path):
                    if f'dep_rpm' in i:
                        rpm_file = os.path.join(rpm_path, i)
                        return success(result=self.read_csv(rpm_file))
                return success()
            app_file = json.loads(mig_ass.app_config).get('app_detail', '')
            return success(result=self.read_csv(app_file))
        else:
            return success()


    def post_ass_start(self, request):
        res = self.require_param_validate(request, ['ip', 'version', 'repo_type', 'ass_type'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        ance_path = os.path.realpath(__file__).rsplit('/', 3)[0]
        ance_path = os.path.join(ance_path, 'ance')
        if not os.path.exists(ance_path):
            return success(code=400, msg='缺少迁移评估工具，请放置工具后再尝试。')

        ip = request.data.pop('ip')
        version = request.data.get('version')
        err = []
        for i in ip:
            mig_ass = MigAssModel.objects.filter(ip=i, status='running').first()
            mig_imp = MigImpModel.objects.filter(ip=i, status='running').first()
            if mig_ass or mig_imp:
                msg = f'主机{ip}正在迁移评估中。' if mig_ass else f'主机{ip}正在迁移实施中。'
                err.append(msg)
            else:
                mig_ass = MigAssModel.objects.create(**dict(ip=i, new_ver=version, config=json.dumps(request.data)))
                threading.Thread(target=self.run_mig_ass, args=(mig_ass, ance_path)).start()
        if err:
            return success(code=400, msg='\n'.join(err))
        return success()


    def run_mig_ass(self, mig_ass, ance_path):
        host_url = f'{settings.SYSOM_API_URL}/api/v1/host/?ip={mig_ass.ip}'
        res = requests.get(host_url)
        try:
            host_info = res.json().get('data', [])
            mig_ass.hostname = host_info[0].get('hostname')
        except:
            mig_ass.status = 'fail'
            mig_ass.detail = '获取机器信息异常'
            mig_ass.save()
            return

        result, _ = sync_job(mig_ass.ip, "cat /etc/os-release | grep '^PRETTY_NAME=' | awk -F '\"' '{print $2}'")
        if result.code != 0:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
            mig_ass.save()
            return
        mig_ass.old_ver = result.result
        mig_ass.save()

        tar_path = None
        rpm_path = None
        sql_path = None
        for i in os.listdir(ance_path):
            if 'pkgs.tar.gz' in i:
                tar_path = os.path.join(settings.MIG_ASS_ANCE, i)
                result = send_file([mig_ass.ip,], os.path.join(ance_path, i), tar_path)
            if 'x86_64.rpm' in i:
                rpm_path = os.path.join(settings.MIG_ASS_ANCE, i)
                result = send_file([mig_ass.ip,], os.path.join(ance_path, i), rpm_path)
            if '.sqlite' in i:
                sql_path = os.path.join(settings.MIG_ASS_ANCE, i)
                result = send_file([mig_ass.ip,], os.path.join(ance_path, i), sql_path)
        if not tar_path or not rpm_path or not sql_path:
            mig_ass.status = 'fail'
            mig_ass.detail = '缺少迁移评估工具，请放置工具后再尝试。'
            mig_ass.save()
            return

        config = json.loads(mig_ass.config)
        config.update(dict(tar_path=tar_path))
        config.update(dict(rpm_path=rpm_path))
        config.update(dict(sql_path=sql_path))
        mig_ass.config = json.dumps(config)
        mig_ass.save()

        ass_func = []
        for i in config.get('ass_type', []):
            ass_func.append(getattr(self, i))
        if len(ass_func) > 1:
            ass_func.insert(1, self.init_ance)

        for func in ass_func:
            func(mig_ass.id, mig_ass.ip, mig_ass.config)
            mig_ass = MigAssModel.objects.filter(id=mig_ass.id).first()
            if mig_ass.status != 'running':
                break
            mig_ass.rate += int(100/len(ass_func))
            mig_ass.save()
        else:
            mig_ass = MigAssModel.objects.filter(id=mig_ass.id).first()
            mig_ass.rate = 100
            mig_ass.status = 'success'
            mig_ass.detail = '评估完成'
            mig_ass.save()


    def get_result_tar(self, ip, lpath, rpath):
        cmd = f'cd {rpath}; rm -rf result.tar.gz; tar zcvf result.tar.gz *'
        result, _ = sync_job(ip, cmd, timeout=60000)
        if result.code != 0:
            return False
        result = get_file(ip, f'{lpath}/result.tar.gz', f'{rpath}/result.tar.gz')
        if result.code != 0:
            return False
        try:
            with tarfile.open(f'{lpath}/result.tar.gz', 'r') as t:
                t.extractall(f'{lpath}')
            logger.info(f'get a result from {ip} to {lpath}')
            return True
        except:
            return False


    def init_ance(self, id, ip, config):
        config = json.loads(config)
        rpm_path = config.get('rpm_path')

        mig_ass = MigAssModel.objects.filter(id=id).first()
        result, _ = sync_job(ip, run_script_ignore(init_ance_script.replace('ANCE_RPM_PATH', rpm_path)), timeout=300000)
        if result.code != 0:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
            mig_ass.save()
            return


    def mig_imp(self, id, ip, config):
        config = json.loads(config)
        repo_url = config.get('repo_url')
        if repo_url:
            script = ass_imp_script.replace('REPO_URL', f'leapp customrepo --seturl {repo_url}')
        else:
            script = ass_imp_script.replace('REPO_URL', 'pwd')

        mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=id, mig_type='ass', job_name='mig_imp'))
        cmd = run_script_ignore(script)
        result, res = sync_job(ip, cmd, timeout=3600000)
        mig_job.job_data = json.dumps(res)
        mig_job.job_result = json.dumps(result.__dict__)

        imp_result = []
        if result.code == 0:
            mig_job.job_status = 'success'
            mig_job.save()

            imp_path = os.path.join(settings.MIG_ASS_DIR, str(id), 'imp')
            if not os.path.exists(imp_path):
                os.makedirs(imp_path)
            imp_file = os.path.join(imp_path, 'mig_ass_imp.json')
            mig_imp = get_file(ip, imp_file, settings.MIG_ASS_JSON)

            if mig_imp.code == 0:
                with open(imp_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                for i in data.get('entries'):
                    tmp = dict(
                        title = i.get('title'),
                        summary = i.get('summary'),
                        severity = i.get('severity'),
                        flags = i.get('flags')
                    )
                    remediations = i.get('detail', {}).get('remediations', [])
                    rem = list()
                    for j in remediations:
                        s = j.get('context')
                        if isinstance(s, list):
                            s = ' '.join(s)
                        rem.append(dict(
                            type = j.get('type'),
                            context = s
                        ))
                    tmp['remediations'] = rem if rem else None
                    imp_result.append(tmp)
        else:
            mig_job.job_status = 'fail'
            mig_job.save()
        
        mig_ass = MigAssModel.objects.filter(id=id).first()
        if imp_result:
            mig_ass.imp_report = json.dumps(imp_result)
            mig_ass.save()
        else:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
            mig_ass.save()


    def mig_sys(self, id, ip, config):
        config = json.loads(config)
        sql_path = config.get('sql_path')

        mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=id, mig_type='ass', job_name='mig_sys'))
        cmd = run_script_ignore(ass_sys_script.replace('ANCE_SQL_PATH', sql_path))
        result, res = sync_job(ip, cmd, timeout=3600000)
        mig_job.job_data = json.dumps(res)
        mig_job.job_result = json.dumps(result.__dict__)

        sys_result = {}
        if result.code == 0:
            mig_job.job_status = 'success'
            mig_job.save()

            sys_path = os.path.join(settings.MIG_ASS_DIR, str(id), 'sys')
            if not os.path.exists(sys_path):
                os.makedirs(sys_path)
            flag = self.get_result_tar(ip, sys_path, settings.MIG_ASS_SYS)
            if flag:
                for i in os.listdir(sys_path):
                    if 'detail.csv' in i:
                        key = i.split('()')[0]
                        value = os.path.join(sys_path, i)
                        sys_result[key] = value
                for i in os.listdir(os.path.join(sys_path, 'kernel')):
                    if 'detail.csv' in i:
                        key = i.split('()')[0]
                        value = os.path.join(sys_path, 'kernel', i)
                        sys_result[key] = value
        else:
            mig_job.job_status = 'fail'
            mig_job.save()

        mig_ass = MigAssModel.objects.filter(id=id).first()
        if sys_result:
            mig_ass.sys_config = json.dumps(sys_result)
            mig_ass.save()
        else:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
            mig_ass.save()


    def mig_hard(self, id, ip, config):
        config = json.loads(config)
        sql_path = config.get('sql_path')

        mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=id, mig_type='ass', job_name='mig_hard'))
        cmd = run_script_ignore(ass_hard_script.replace('ANCE_SQL_PATH', sql_path))
        result, res = sync_job(ip, cmd, timeout=3600000)
        mig_job.job_data = json.dumps(res)
        mig_job.job_result = json.dumps(result.__dict__)

        hard_info = None
        hard_result = None
        if result.code == 0:
            mig_job.job_status = 'success'
            mig_job.save()

            hard_path = os.path.join(settings.MIG_ASS_DIR, str(id), 'hard')
            if not os.path.exists(hard_path):
                os.makedirs(hard_path)
            flag = self.get_result_tar(ip, hard_path, settings.MIG_ASS_HARD)
            if flag:
                hard_info = self.read_csv(os.path.join(hard_path, 'machinfo.csv'))
                for i in os.listdir(hard_path):
                    if 'detail.csv' in i:
                        hard_result = self.read_csv(os.path.join(hard_path, i))
        else:
            mig_job.job_status = 'fail'
            mig_job.save()
        
        mig_ass = MigAssModel.objects.filter(id=id).first()
        if hard_info:
            mig_ass.hard_info = json.dumps(hard_info)
        if hard_result:
            mig_ass.hard_result = json.dumps(hard_result)
        if result.code != 0:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
        mig_ass.save()


    def mig_app(self, id, ip, config):
        config = json.loads(config)
        ass_app = config.get('ass_app')
        sql_path = config.get('sql_path')
        if ass_app:
            cmd = run_script_ignore(ass_app_script.replace('ANCE_SQL_PATH', sql_path).replace('RPM_LIST', f'--rpmlist={ass_app}'))
        else:
            cmd = run_script_ignore(ass_app_script.replace('ANCE_SQL_PATH', sql_path).replace('RPM_LIST', ' '))

        mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=id, mig_type='ass', job_name='mig_app'))
        result, res = sync_job(ip, cmd, timeout=3600000)
        mig_job.job_data = json.dumps(res)
        mig_job.job_result = json.dumps(result.__dict__)

        app_result = {}
        if result.code == 0:
            mig_job.job_status = 'success'
            mig_job.save()

            app_path = os.path.join(settings.MIG_ASS_DIR, str(id), 'app')
            if not os.path.exists(app_path):
                os.makedirs(app_path)
            flag = self.get_result_tar(ip, app_path, settings.MIG_ASS_APP)
            if flag:
                app_detail = None
                for i in os.listdir(app_path):
                    if 'detail.csv' in i:
                        app_detail = os.path.join(app_path, i)
                if app_detail:
                    app_result['app_detail'] = app_detail
                    for i in self.read_csv(app_detail):
                        rpm_name = i.get('rpm_name')
                        for j in os.listdir(os.path.join(app_path, 'packages')):
                            if j in rpm_name:
                                app_result[rpm_name] = os.path.join(app_path, 'packages', j)
        else:
            mig_job.job_status = 'fail'
            mig_job.save()
        
        mig_ass = MigAssModel.objects.filter(id=id).first()
        if app_result:
            mig_ass.app_config = json.dumps(app_result)
            mig_ass.save()
        else:
            mig_ass.status = 'fail'
            mig_ass.detail = result.result
            mig_ass.save()


    def post_ass_stop(self, request):
        res = self.require_param_validate(request, ['id'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        ass_id = request.data.get('id')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.status == 'running':
            mig_ass.status = 'stop'
            mig_ass.save()
            return success()
        else:
            return success(code=400, msg='状态异常')


    def post_ass_delete(self, request):
        res = self.require_param_validate(request, ['id'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        ass_id = request.data.get('id')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.status != 'running':
            mig_ass.delete()
            return success()
        else:
            return success(code=400, msg='状态异常')


    def post_ass_retry(self, request):
        res = self.require_param_validate(request, ['id'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        ance_path = os.path.realpath(__file__).rsplit('/', 3)[0]
        ance_path = os.path.join(ance_path, 'ance')
        if not os.path.exists(ance_path):
            return success(code=400, msg='缺少迁移评估工具，请放置工具后再尝试。')

        ass_id = request.data.get('id')
        mig_ass = MigAssModel.objects.filter(id=ass_id).first()
        if mig_ass and mig_ass.status != 'running':
            mig = MigAssModel.objects.filter(ip=mig_ass.ip, status='running').first()
            imp = MigImpModel.objects.filter(ip=mig_ass.ip, status='running').first()
            if mig or imp:
                msg = '有其它相同的评估任务运行中' if mig else '当前主机正在运行迁移实施'
                return success(code=400, msg=msg)
            else:
                mig = MigAssModel.objects.create(**dict(hostname=mig_ass.hostname, ip=mig_ass.ip, new_ver=mig_ass.new_ver, config=mig_ass.config))
                threading.Thread(target=self.run_mig_ass, args=(mig, ance_path)).start()
                return success()
        else:
            return success(code=400, msg='状态异常')


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
            for key, value in json.loads(result.result).items():
                tmp = []

                for k, v in value.items():
                    tmp.append(dict(name=k, value=v))
                    if k == u'内存':
                        res, _ = sync_job(mig_imp.ip, 'df -h')
                        tmp.append(dict(name='磁盘空间', value=res.result))
                    if k == u'操作系统版本':
                        mig_imp.old_ver = v

                info[key] = tmp

            mig_imp.new_info = json.dumps(info)
            if not mig_imp.old_info:
                mig_imp.old_info = json.dumps(info)
            mig_imp.save()
            return 200, 'success', info
        else:
            return 400, result.result, None


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


    def post_host_migrate_base(self, ip, step, steps, data):
        mig_imp = MigImpModel.objects.filter(ip=ip).first()
        if not mig_imp:
            return f'主机{ip}尚未初始化。'
        if step < 101 and mig_imp.status in ['running', 'success', 'unsupported']:
            return f'主机{ip}当前状态无法进行此操作。'
        if step < 101 and mig_imp.step != step:
            return f'主机{ip}无法执行此步骤，请按操作步骤顺序执行。'
        return steps[str(step)](mig_imp, data)


    def post_host_migrate(self, request):
        res = self.require_param_validate(request, ['step', 'ip'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        step = request.data.get('step')
        ip = request.data.get('ip')
        steps = self.get_mig_func()

        err = []
        for i in ip:
            mig_ass = MigAssModel.objects.filter(ip=i, status='running').first()
            if mig_ass:
                err.append(f'主机{i}正在进行评估中。')
                continue
            res = self.post_host_migrate_base(i, step, steps, request.data)
            if res:
                err.append(res)
        if err:
            return success(code=400, msg='\n'.join(err))
        return success()


    def post_host_migrate_all(self, ip, steps, data):
        mig_ass = MigAssModel.objects.filter(ip=ip, status='running').first()
        mig_imp = MigImpModel.objects.filter(ip=ip).first()
        if mig_ass or not mig_imp or mig_imp.status in ['running', 'success']:
            return
        mig_imp.status = 'pending'
        mig_imp.save()

        while True:
            mig_imp = MigImpModel.objects.filter(ip=ip).first()
            if mig_imp.status in ['fail', 'unsupported'] or mig_imp.step > 5:
                break
            if mig_imp.status == 'running':
                time.sleep(random.randint(3,5))
                continue
            self.post_host_migrate_base(ip, mig_imp.step, steps, data)


    def post_all_migrate(self, request):
        res = self.require_param_validate(request, ['ip'])
        if not res['success']:
            return ErrorResponse(msg=res['msg'])

        ip = request.data.get('ip')
        steps = self.get_mig_func()
        for i in ip:
            threading.Thread(target=self.post_host_migrate_all, args=(i, steps, request.data)).start()
        return success()


    def get_mig_func(self):
        steps = {
            '0': self.mig_config,
            '1': self.mig_backup,
            '2': self.mig_deploy,
            '3': self.mig_ass,
            '4': self.mig_imp,
            '5': self.mig_reboot,
            '101': self.mig_restore,
            '102': self.mig_init,
        }
        return steps


    def get_mig_step(self, step, flag):
        steps = [
            '实施配置',
            '系统备份',
            '环境准备',
            '风险评估',
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
                res.append(dict(name=v, value='等待中'))
        return dict(migration_step=res)


    def mig_config(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.save()

        if not mig_imp.old_ver:
            self.init_info(mig_imp)
        info = []
        info.append(dict(name='系统版本', value=mig_imp.old_ver))
        info.append(dict(name='迁移版本', value=data.get('version')))
        info.append(dict(name='迁移内核', value=data.get('kernel')))
        if data.get('repo_type') == 'public':
            info.append(dict(name='REPO类型', value='公网地址'))
        else:
            info.append(dict(name='REPO类型', value='内网地址'))
            info.append(dict(name='REPO地址', value=data.get('repo_url')))
        if data.get('backup_type') == 'nfs':
            info.append(dict(name='备份类型', value='NFS备份'))
            info.append(dict(name='NFSIP', value=data.get('backup_ip')))
            info.append(dict(name='存放路径', value=data.get('backup_path')))
            info.append(dict(name='忽略目录', value=data.get('backup_exclude')))
        else:
            info.append(dict(name='备份类型', value='不备份'))
        mig_imp.mig_info = json.dumps(dict(migration_info=info))
        mig_imp.new_ver = data.get('version')
        mig_imp.config = json.dumps(data)

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


    def mig_backup(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.save()

        config = json.loads(mig_imp.config)
        backup_type = config.get('backup_type')

        if backup_type == 'nfs':
            ance_path = os.path.realpath(__file__).rsplit('/', 3)[0]
            result = send_file([mig_imp.ip,], os.path.join(ance_path, 'ance/anolis_migration_pkgs.tar.gz'), '/tmp/ance/database/anolis_migration_pkgs.tar.gz')
            if result.code != 0:
                mig_imp.status = 'fail'
                mig_imp.detail = '下发备份工具失败'
                mig_imp.save()
                return mig_imp.detail

            backup_ip = config.get('backup_ip')
            backup_path = config.get('backup_path')
            backup_exclude = config.get('backup_exclude')
            if backup_exclude:
                script = f"/usr/sbin/migrear --method nfs --url {backup_ip} --path {backup_path} --exclude '{backup_exclude}'"
            else:
                script = f"/usr/sbin/migrear --method nfs --url {backup_ip} --path {backup_path}"
            cmd = run_script_ignore(backup_script.replace('BACKUP_SCRIPT', script))
            self.run_async_job(mig_imp, 'mig_backup', cmd, timeout=18000000)
            return

        mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
        mig_imp.status = 'pending'
        mig_imp.detail = '请执行下一步'
        mig_imp.step += 1
        mig_imp.save()
        return


    def mig_deploy(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.save()

        ance_path = os.path.realpath(__file__).rsplit('/', 3)[0]
        result = send_file([mig_imp.ip,], os.path.join(ance_path, 'ance/anolis_migration_pkgs.tar.gz'), '/tmp/ance/database/anolis_migration_pkgs.tar.gz')
        if result.code != 0:
            mig_imp.status = 'fail'
            mig_imp.detail = '下发环境工具失败'
            mig_imp.save()
            return mig_imp.detail

        config = json.loads(mig_imp.config)
        repo_url = config.get('repo_url')
        if repo_url:
            script = deploy_tools_script.replace('REPO_URL', f'leapp customrepo --seturl {repo_url}')
        else:
            script = deploy_tools_script.replace('REPO_URL', 'pwd')

        cmd = run_script_ignore(script)
        self.run_async_job(mig_imp, 'mig_deploy', cmd)
        return


    def mig_ass(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.save()
        ass_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
        ass_file = os.path.join(ass_path, 'mig_ass_log.log')

        cmd = run_script_ignore(mig_ass_script.replace('REPLACE_DIR', ass_path).replace('REPLACE_FILE', ass_file))
        mig_job = self.run_async_job(mig_imp, 'mig_ass', cmd, timeout=3600000)
        threading.Thread(target=self.get_log_report, args=(mig_imp, 'mig_ass_log', mig_job.id)).start()
        return


    def mig_imp(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.save()
        imp_path = os.path.join(settings.MIG_IMP_DIR, mig_imp.ip)
        imp_file = os.path.join(imp_path, 'mig_imp_log.log')

        cmd = run_script_ignore(mig_imp_script.replace('REPLACE_DIR', imp_path).replace('REPLACE_FILE', imp_file))
        mig_job = self.run_async_job(mig_imp, 'mig_imp', cmd, timeout=3600000)
        threading.Thread(target=self.get_log_report, args=(mig_imp, 'mig_imp_log', mig_job.id)).start()
        return


    def mig_reboot(self, mig_imp, data):
        mig_imp.status = 'running'
        mig_imp.detail = '重启中'
        mig_imp.save()
        sync_job(mig_imp.ip, 'reboot')
        threading.Thread(target=self.run_reboot_job, args=(mig_imp, )).start()
        return


    def mig_restore(self, mig_imp, data):
        if mig_imp.status == 'running':
            return f'主机{mig_imp.ip}当前状态无法进行此操作。'
        if mig_imp.step < 2:
            return f'主机{mig_imp.ip}尚未进行备份，无法还原。'

        config = json.loads(mig_imp.config)
        backup_type = config.get('backup_type')

        if backup_type == 'nfs':
            mig_imp.status = 'running'
            mig_imp.detail = '还原中'
            mig_imp.save()
            threading.Thread(target=self.run_restore_job, args=(mig_imp, )).start()
            return

        return f'主机{mig_imp.ip}没有配置备份方案，无需还原.'


    def mig_init(self, mig_imp, data):
        if mig_imp.status == 'running':
            return f'主机{mig_imp.ip}当前状态无法进行此操作。'
        MigImpModel.objects.create(**dict(ip=mig_imp.ip))
        return


    def run_async_job(self, mig_imp, job_name, cmd, timeout=600000):
        mig_job = MigJobModel.objects.create(**dict(ip=mig_imp.ip, mig_id=mig_imp.id, mig_type='imp', job_name=job_name))
        def finish(result):
            logger.info(result.__dict__)
            job_id = result.echo.get('mig_job_id')
            mig_ip = result.echo.get('mig_ip')
            mig_job = MigJobModel.objects.filter(id=job_id).first()
            mig_job.job_result = json.dumps(result.__dict__)
            mig_job.job_status = 'success' if result.code == 0 else 'fail'
            mig_job.save()

            if mig_job.job_name in ['mig_ass', 'mig_imp']:
                return
            mig_imp = MigImpModel.objects.filter(ip=mig_ip).first()
            if result.code == 0:
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
                mig_imp.status = 'pending'
                mig_imp.detail = '请执行下一步'
                mig_imp.step += 1
            else:
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
                mig_imp.status = 'fail'
                mig_imp.detail = result.result
            mig_imp.save()

        mig_imp.status = 'running'
        mig_imp.detail = ''
        mig_imp.save()
        echo = dict(mig_job_id=mig_job.id, mig_ip = mig_imp.ip)
        res = async_job(mig_imp.ip, cmd, echo=echo, timeout=timeout, finish=finish)
        mig_job.job_data = json.dumps(res)
        mig_job.save()
        return mig_job


    def get_log_report(self, mig_imp, job_name, main_job_id):
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
                try:
                    rate = json.loads(p).get('Progress', 0)
                except:
                    rate = 0
                rate = 100 if rate >= 100 else rate
                mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
                mig_imp.rate = rate
                mig_imp.save()
            else:
                rate = 0

            main_job = MigJobModel.objects.filter(id=main_job_id).first()
            if main_job.job_status == 'running':
                continue
            mig_job = MigJobModel.objects.filter(ip=mig_imp.ip, mig_id=mig_imp.id, job_name=job_name).first()
            mig_job.job_status = 'success'
            mig_job.save()

            mig_imp = MigImpModel.objects.filter(id=mig_imp.id).first()
            if main_job.job_status == 'success':
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
                mig_imp.status = 'pending'
                mig_imp.detail = '请执行下一步'
                mig_imp.step += 1
            else:
                mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
                mig_imp.status = 'fail'
                if main_job.job_result:
                    mig_imp.detail = json.loads(main_job.job_result).get('result', '')
                else:
                    mig_imp.detail = ''
            mig_imp.save()
            break


    def run_reboot_job(self, mig_imp):
        time.sleep(15)
        flag = False
        i = 0
        while i < int(settings.MIG_IMP_REBOOT):
            i += 1
            time.sleep(15)
            result, _ = sync_job(mig_imp.ip, 'cat /etc/os-release')
            if result.code == 0 and 'Anolis OS' in result.result:
                flag = True
                break

        if flag:
            self.init_info(mig_imp)
            mig_imp.rate = 100
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, True))
            mig_imp.status = 'success'
            mig_imp.detail = '迁移完成'
            mig_imp.step += 1
        else:
            mig_imp.mig_step = json.dumps(self.get_mig_step(mig_imp.step, False))
            mig_imp.status = 'fail'
            mig_imp.detail = '重启失败'
        mig_imp.save()


    def run_restore_job(self, mig_imp):
        result, _ = sync_job(mig_imp.ip, run_script(restore_script))
        if result.code != 0:
            mig_imp.status = 'fail'
            mig_imp.detail = result.result
            mig_imp.save()
            return

        sync_job(mig_imp.ip, 'reboot')
        mig_imp.status = 'running'
        mig_imp.detail = '重启中'
        mig_imp.save()

        time.sleep(15)
        flag = False
        i = 0
        while i < int(settings.MIG_IMP_REBOOT):
            i += 1
            time.sleep(15)
            result, _ = sync_job(mig_imp.ip, 'cat /etc/os-release')
            if result.code == 0:
                flag = True
                break

        if flag:
            mig_imp.status = 'success'
            mig_imp.detail = '还原成功'
            mig_imp.save()
            time.sleep(5)
            MigImpModel.objects.create(**dict(ip=mig_imp.ip))
            return
        else:
            mig_imp.status = 'fail'
            mig_imp.detail = '还原失败'
            mig_imp.save()
