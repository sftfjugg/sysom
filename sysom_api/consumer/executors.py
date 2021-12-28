import socket
from apps.host.models import HostModel
from lib.ssh import SSH
from apps.task.models import JobModel


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
                    update_job(instance=self.job, status="Fail", job_result="script result find not instance or cmd")
                    break
                host_ips.append(ip)
                host = HostModel.objects.filter(ip=ip).first()
                ssh_cli = SSH(host.ip, host.port, host.username, host.private_key)
                with ssh_cli as ssh:
                    status, result = ssh.exec_command(cmd)
                    if str(status) != '0':
                        update_job(instance=self.job, status="Fail", job_result=result, host_by=host_ips)
                        break
                    if count == len(self.resp_scripts):
                        update_job(instance=self.job, status="Success", job_result=result, host_by=host_ips)
                    if self.kwargs.get('update_host_status', None):
                        host.status = status if status == 0 else 1
                        host.save()
        except socket.timeout:
            update_job(instance=self.job, status="Fail", job_result="socket time out")
        except Exception as e:
            update_job(instance=self.job, status="Fail", job_result=str(e))


def update_job(instance: JobModel, **kwargs):
    try:
        instance.__dict__.update(**kwargs)
        instance.save()
        return instance
    except Exception as e:
        raise e
