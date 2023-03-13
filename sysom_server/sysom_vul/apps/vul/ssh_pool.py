# -*- encoding: utf-8 -*-
"""
@File    : ssh_pool.py
@Time    : 2022/2/22 下午3:50
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
import os
from loguru import logger
from multiprocessing.pool import Pool
from typing import List, Callable, Dict
from django.conf import settings
from channel_job.job import ChannelJobExecutor


class VulTaskManager:
    """vul任务执行管理器

    Aargs
        hosts(List): 执行任务的机器ip
        command(str): 需要在机器上执行的命令或脚本
    """
    def __init__(self, hosts: List[str], command: str) -> None:
        self._hosts = hosts
        self._command = command
        self._result: list = []
        self.processes = min(len(hosts), os.cpu_count())
        self._pool = Pool(processes=self.processes)

    @staticmethod
    def run_command(ip: str, command: str) -> Dict:
        logger.info(f'Processing tasks ip: {ip}')
        channel_job = ChannelJobExecutor()
        channel_job.init_config(settings.CHANNEL_JOB_URL)
        channel_job.start()

        params: dict = {}
        params['channel_type'] = 'ssh'
        params['channel_opt'] = 'cmd'
        params['params'] = {'instance': ip, "command": command}
        params['timeout'] = 20 * 1000
        params['auto_retry'] = True

        job_result = channel_job.dispatch_job(**params).execute()

        return {
            'host': ip,
            'ret': {
                "status": job_result.code,
                "result": job_result.result
            }
        }

    def run(self, func: Callable[[str, str], Dict]) -> List:
        """执行任务
        
        Args
            func(Callable): 执行任务的具体方法
        """
        for ip in self._hosts:
            self._pool.apply_async(func, args=(
                ip, self._command), callback=self._result.append)

        self._pool.close()
        self._pool.join()

        return self._result
