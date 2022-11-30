import os
import time
import logging
import requests
import threading

from django.conf import settings
from apps.migration.models import MigImpModel, MigImpInfoModel, MigJobModel
from lib.utils import uuid_8
from lib.base_view import CommonModelViewSet
from lib.response import success, other_response, not_found, ErrorResponse
from lib.channel import sync_job, async_job, send_file, get_file
from lib.script import init_info_script, run_imp_script

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
            self.init_imp(res.json().get('data', []))
            mig_imp = MigImpModel.objects.filter(cluster_id=group_id)
            return success(result=[i.to_dict() for i in mig_imp])
        else:
            return success()


    def init_imp(self, data):
        for i in data:
            mig_imp = MigImpModel.objects.filter(ip=i.get('ip'))
            if not mig_imp:
                MigImpModel.objects.create(**dict(cluster_id=i.get('cluster'), hostname=i.get('hostname'), ip=i.get('ip')))
                MigImpInfoModel.objects.create(**dict(ip=i.get('ip')))


    def get_host_info(self, request):
        host_ip = request.GET.get('ip')
        mig_info = MigImpInfoModel.objects.filter(ip=host_ip).first()
        if mig_info and mig_info.new_info:
            result = dict()
            result.update(mig_info.new_info)
            result.update(mig_info.mig_info)
            return success(result=result)
        else:
            code, message, data = self.init_info(host_ip, mig_info)
            return success(code=code, message=message, result=data)


    def init_info(self, host_ip, mig_info):
        result, data = sync_job(host_ip, init_info_script)
        if result.code == 0:
            info = dict()
            for i in result.result.splitlines():
                key, value = i.split(':')
                tmp = []
                for j in value.split(','):
                    t = j.split('=')
                    tmp.append(dict(name=t[0], value=t[1]))
                info[key] = tmp
            mig_info.old_info = info
            mig_info.new_info = info
            mig_info.save()
            res = dict()
            res.update(info)
            res.update(mig_info.mig_info)
            return 200, 'success', res
        else:
            return 400, result.err_msg, None


    def get_host_log(self, request):
        host_ip = request.GET.get('ip')
        mig_info = MigImpInfoModel.objects.filter(ip=host_ip).first()
        if mig_info and mig_info.log:
            return success(result=mig_info.log)
        else:
            return success()


    def get_host_report(self, request):
        host_ip = request.GET.get('ip')
        mig_info = MigImpInfoModel.objects.filter(ip=host_ip).first()
        if mig_info and mig_info.cmp_info:
            return success(result=mig_info.cmp_info)
        else:
            return success()


    def post_host_migrate(self, request):
        res = self.extract_specific_params(request, ['ip', 'version', 'kernel', 'repo_type', 'repo_url'])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        for i in request.data.get('ip', []):
            self.init_mig_task(i, request.data)
        return success()


    def init_mig_task(self, ip, data):
        mig_imp = MigImpModel.objects.filter(ip=ip).first()
        if not mig_imp or mig_imp.status != 'waiting':
            return
        mig_info = MigImpInfoModel.objects.filter(ip=ip).first()
        if not mig_info:
            return
        info = []
        info.append(dict(name='迁移版本', value=data.get('version')))
        info.append(dict(name='迁移内核', value=data.get('kernel')))
        info.append(dict(name='repo类型', value=data.get('repo_type')))
        info.append(dict(name='repo地址', value=data.get('repo_url')))
        mig_info.mig_info = dict(migration_info=info)
        mig_info.save()

        threading.Thread(target=self.get_imp_log, args=(ip,), daemon=True).start()
        threading.Thread(target=self.run_imp, args=(ip,), daemon=True).start()

    
    def get_imp_log(self, ip):
        mig_id = None
        while True:
            time.sleep(5)
            if mig_id is None:
                mig_id = uuid_8()
                mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=mig_id, mig_type='imp', job_name='get_imp_log'))
                continue

            mig_imp = MigImpModel.objects.filter(ip=ip).first()
            mig_info = MigImpInfoModel.objects.filter(ip=ip).first()
            mig_job = MigJobModel.objects.filter(ip=ip, mig_id=mig_id).first()
            if mig_job.job_status != 'running':
                break

            log_path = os.path.join(settings.MIG_IMP_DIR, ip)
            if not os.path.exists(log_path):
                os.makedirs(log_path)
            log_file = os.path.join(log_path, 'mig_imp.log')
            mig_log = get_file(ip, log_file, settings.MIG_IMP_LOG)
            if mig_log.code == 0:
                with open(log_file, 'r', encoding='utf-8') as f:
                    p = f.read()
                mig_info.log = p
                mig_info.save()


    def run_imp(self, ip):
        mig_id = uuid_8()
        mig_job = MigJobModel.objects.create(**dict(ip=ip, mig_id=mig_id, mig_type='imp', job_name='run_imp'))

        def finish(job_result):
            time.sleep(5)
            mig_id = job_result.echo.get('mig_id')
            mig_ip = job_result.echo.get('mig_ip')
            mig_job = MigJobModel.objects.filter(ip=mig_ip, mig_id=mig_id).first()
            if job_result.code == 0:
                mig_job.job_status = 'success'
            else:
                mig_job.job_status = 'fail'
            mig_job.save()

        echo = dict(mig_id = mig_id, mig_ip = ip)
        data = async_job(ip, run_imp_script, echo=echo, timeout=3600000, finish=finish)
        mig_job.job_data = data
        mig_job.save()


    def post_host_stop(self, request):
        res = self.require_param_validate(request, ['ip'])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        return success(code=400, message='功能尚在开发中。')


    def post_host_reboot(self, request):
        res = self.require_param_validate(request, ['ip'])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        host_ip = request.data.get('ip')
        mig_data = MigImpModel.objects.filter(ip=host_ip).first()
        if mig_data and mig_data.status == 'success':
            result, data = sync_job(host_ip, 'reboot')
            return success(message='重启成功，稍后请刷新页面。')
        else:
            return success(code=400, message='当前状态无法重启。')
