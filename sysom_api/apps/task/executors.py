import json
import os
import socket
import subprocess
import logging
import platform
from apps.task.models import JobModel
from django.conf import settings
from django.db import connection
from .channel import Channel
from lib.response import ErrorResponse
from lib.utils import HTTP

logger = logging.getLogger(__name__)


class SshJob:
    def __init__(self, resp_scripts, task_id, **kwargs):
        self.resp_scripts = resp_scripts
        self.task_id = task_id
        self.kwargs = kwargs
        self.instance = self.get_object()

    def run(self):
        self.update_job(status="Running")
        if settings.IS_MICRO_SERVICES:
            setattr(self, 'user', self.kwargs.get('user'))
            self._api_service()
        else:
            self._import_service()

    def update_job(self, **kwargs):
        try:
            self.instance.__dict__.update(**kwargs)
            self.instance.save()
        except Exception as e:
            raise e
        finally:
            connection.close()
    
    def get_object(self):
        try:
            return JobModel.objects.get(task_id=self.task_id)
        except JobModel.DoesNotExist:
            raise ErrorResponse(msg=f'task id: {self.task_id} not exist!')

    def _api_service(self):      
        """
        API调用, 执行Task任务
        """
        host_ips = []
        count = 0
        for script in self.resp_scripts:
            count = count + 1
            ip = script.get("instance", None)
            cmd = script.get("cmd", None)
            if not ip or not cmd:
                self.update_job(status="Fail", result="script result find not instance or cmd")
                break
            host_ips.append(ip)

            status_code, result = Channel.post_channel(data=script, token=self.user['token'])
            if status_code == 200:
                _, r = Channel.get_channel_result(
                    data={'invoke_id': result['invoke_id']},
                    token=self.user['token']
                )
                status = r['state']
                result = r['result']
            else:
                self.update_job(status="Fail", result={'state': 1, 'result': f'{ip}: {result}'})
                break

            if self.kwargs.get('update_host_status', None):
                patch_host_url = f'{settings.HOST_LIST_API}update/{ip}/'
                HTTP.request('patch', url=patch_host_url, data={'status': status if status == 0 else 1}, token=self.user['token'])
                
            if self.kwargs.get('service_name', None) == "node_delete":
                del_host_url = f'{settings.HOST_LIST_API}del/{ip}/'
                HTTP.request('delete', url=del_host_url, token=self.user['token'], data={})

            if status != 0:
                self.update_job(status="Fail", result=r, host_by=host_ips)
                break
            
            if count == len(self.resp_scripts):
                res = r
                params = self.instance.params
                if params:
                    service_name = params.get("service_name", None)
                    if service_name:
                        SCRIPTS_DIR = settings.SCRIPTS_DIR
                        service_post_name = service_name + '_post'
                        service_post_path = os.path.join(
                            SCRIPTS_DIR, service_post_name)
                        if os.path.exists(service_post_path):
                            command_list = ['python', service_post_path, res['result'], self.instance.task_id] if platform.system() == "Windows" else [service_post_path, res['result'], self.instance.task_id]
                            try:
                                resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                                      stderr=subprocess.PIPE)
                                if resp.returncode != 0:
                                    logger.error(
                                        f'执行失败: {resp.stderr.decode("utf-8")}')
                                    self.update_job(status="Fail", result=resp.stderr.decode('utf-8'))
                                    break
                                stdout = resp.stdout
                                try:
                                    result = stdout.decode('utf-8')
                                except UnicodeDecodeError as e:
                                    result = stdout.decode('gbk')

                                res = json.loads(result)
                            except Exception as e:
                                logger.error(f'ERROR: {e}')
                                self.update_job(status="Fail", result=str(e))
                                break
                        
                self.update_job(status="Success", result=res, host_by=host_ips)
                
        
    def _import_service(self):
        from apps.host.models import HostModel
        from apps.channel.channels.ssh import SSH

        try:
            self.update_job(status="Running")
            host_ips = []
            count = 0
            for script in self.resp_scripts:
                count = count + 1
                ip = script.get("instance", None)
                cmd = script.get("cmd", None)
                if not ip or not cmd:
                    self.update_job(status="Fail",
                               result="script result find not instance or cmd")
                    break
                host_ips.append(ip)

                try:
                    host = HostModel.objects.get(ip=ip)
                except HostModel.DoesNotExist:
                    self.update_job(status="Fail",
                               result="host not found by script return IP:%s" % ip)
                    break
                ssh_cli = SSH(
                    hostname=host.ip, port=host.port, username=host.username)

                status, result = ssh_cli.run_command(cmd)

                if self.kwargs.get('service_name', None) == "node_delete":
                    logger.info(f'HOST: {host}')
                    host.delete()
                if status != 0:
                    self.update_job(status="Fail",
                               result=result, host_by=host_ips)
                    break
                if count == len(self.resp_scripts):
                    params = self.instance.params
                    if params:
                        params = json.loads(params)
                        service_name = params.get("service_name", None)
                        if service_name:
                            SCRIPTS_DIR = settings.SCRIPTS_DIR
                            service_post_name = service_name + '_post'
                            service_post_path = os.path.join(
                                SCRIPTS_DIR, service_post_name)
                            if os.path.exists(service_post_path):
                                try:
                                    resp = subprocess.run([service_post_path, result], stdout=subprocess.PIPE,
                                                          stderr=subprocess.PIPE)
                                    if resp.returncode != 0:
                                        logger.error(
                                            f'执行失败: {resp.stderr.decode("utf-8")}')
                                        self.update_job(status="Fail",
                                                   result=resp.stderr.decode('utf-8'))
                                        break
                                    stdout = resp.stdout
                                    result = stdout.decode('utf-8')
                                except Exception as e:
                                    logger.error(f'ERROR: {e}')
                                    self.update_job(status="Fail", result=str(e))
                                    break
                    self.update_job(status="Success",
                               result=result, host_by=host_ips)
        except socket.timeout:
            self.update_job(status="Fail", result="socket time out")
        except Exception as e:
            logger.error(f'ERROR: {e}')
            self.update_job(status="Fail", result=str(e))
        finally:
            connection.close()
