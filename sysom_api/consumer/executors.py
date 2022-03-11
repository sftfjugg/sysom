import ast
import json
import os
import socket
import subprocess

from apps.host.models import HostModel
from lib.ssh import SSH
from apps.task.models import JobModel
from sysom import settings


class SshJob:
    def __init__(self, resp_scripts, job, **kwargs):
        self.resp_scripts = resp_scripts
        self.job = job
        self.kwargs = kwargs

    def run(self):
        try:
            update_job(instance=self.job, status="Running")
            host_ips = []
            count = 0
            for script in self.resp_scripts:
                count = count + 1
                ip = script.get("instance", None)
                cmd = script.get("cmd", None)
                if not ip or not cmd:
                    update_job(instance=self.job, status="Fail", result="script result find not instance or cmd")
                    break
                host_ips.append(ip)
                host = HostModel.objects.filter(ip=ip).first()
                ssh_cli = SSH(host.ip, host.port, host.username, host.private_key)
                with ssh_cli as ssh:
                    status, result = ssh.exec_command(cmd)
                    if self.kwargs.get('update_host_status', None):
                        host.status = status if status == 0 else 1
                        host.save()
                    if self.kwargs.get('service_name', None) == "node_delete":
                        host.delete()
                    if str(status) != '0':
                        update_job(instance=self.job, status="Fail", result=result, host_by=host_ips)
                        break
                    if count == len(self.resp_scripts):
                        params = self.job.params
                        if params:
                            params = json.loads(params)
                            service_name = params.get("service_name", None)
                            if service_name:
                                SCRIPTS_DIR = settings.SCRIPTS_DIR
                                service_post_name = service_name + '_post'
                                service_post_path = os.path.join(SCRIPTS_DIR, service_post_name)
                                if os.path.exists(service_post_path):
                                    try:
                                        resp = subprocess.run([service_post_path, result], stdout=subprocess.PIPE,
                                                              stderr=subprocess.PIPE)
                                        if resp.returncode != 0:
                                            update_job(instance=self.job, status="Fail",
                                                       result=resp.stderr.decode('utf-8'))
                                            break
                                        stdout = resp.stdout
                                        result = stdout.decode('utf-8')
                                    except Exception as e:
                                        update_job(instance=self.job, status="Fail", result=str(e))
                                        break
                        update_job(instance=self.job, status="Success", result=result, host_by=host_ips)
        except socket.timeout:
            update_job(instance=self.job, status="Fail", result="socket time out")
        except Exception as e:
            update_job(instance=self.job, status="Fail", result=str(e))


def update_job(instance: JobModel, **kwargs):
    try:
        instance.__dict__.update(**kwargs)
        instance.save()
        return instance
    except Exception as e:
        raise e
