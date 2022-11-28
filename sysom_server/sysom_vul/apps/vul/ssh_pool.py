# -*- encoding: utf-8 -*-
"""
@File    : ssh_pool.py
@Time    : 2022/2/22 下午3:50
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
import queue
import logging
import multiprocessing
import time
from django.conf import settings
from channel_job.job import default_channel_job_executor, JobResult

# from lib.ssh import SSH


class SshProcessQueueManager:
    # 设置默认进程数为8
    DEFAULT_FORKS = 8

    def __init__(self, hosts):
        self.hosts = hosts
        # 获取cpu数
        cpu_count = multiprocessing.cpu_count()
        # 设置cpu和默认进程数中的最大值为进程池大小，当任务小于进程池大小时，设置进程池大小为任务数
        self.forks = min(len(self.hosts), max(self.DEFAULT_FORKS, cpu_count))

    def ssh_command(self, que, host, cmd):
        # ssh_cli = SSH(hostname=host.ip, port=host.port, username=host.username)
        # ssh_cli = SSH(host.ip, host.port, host.username, host.private_key)
        default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
        default_channel_job_executor.start()

        job_result = default_channel_job_executor.dispatch_job(
                channel_type="ssh",
                channel_opt='cmd',
                params={
                    'instance': host.ip,
                    "command": cmd
                },
                timeout=5000,
                auto_retry=True
            ).execute()
        # status, result = ssh_cli.run_command(cmd)
        que.put({'host': host,
                 'ret': {
                     "status": job_result.code,
                     "result": job_result.result
                 }})

    def run_subprocess(self, hosts, func, *args):
        que = multiprocessing.Queue()
        running = {}
        hosts_iter = hosts.__iter__()
        success = []
        fail = []
        flags = True
        while True:
            if not hosts or len(set(success + fail)) >= len(hosts):
                break

            if len(running) < self.forks and flags:
                try:
                    host = next(hosts_iter)
                    vars = (
                        que,
                        host,
                        *args
                    )
                    subprocess = multiprocessing.Process(target=func, args=vars)
                    subprocess.start()
                    running[host.hostname] = subprocess
                except StopIteration:
                    flags = False

            for host in running:
                if not running[host].is_alive():
                    try:
                        while True:
                            result = que.get(False)
                            success.append(result["host"])
                            yield result
                    except queue.Empty:
                        pass

                    if host not in success:
                        logging.warning("get {}'s information failed".format(host))
                        fail.append(host)
                    running[host].join()

            for host in success + fail:
                if host in running:
                    running.pop(host)
            time.sleep(0.1)

    def run(self, func, *args):
        result = []
        for i in self.run_subprocess(self.hosts, func, *args):
            result.append(i)
        return result


if __name__ == "__main__":
    pass
