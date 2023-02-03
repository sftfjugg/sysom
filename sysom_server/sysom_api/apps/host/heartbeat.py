import time
import json
import functools
import subprocess
from typing import Optional
from schedule import Scheduler
from loguru import logger
from .models import HostModel
from channel_job import ChannelJobExecutor, JobResult
from django.db import connection
from django.conf import settings
from multiprocessing import Process


class HeartBeatProcess(Process):
    def __init__(
        self,
        heartbeat_interval: int = 5,
        pid: int = 0,
    ) -> None:
        super().__init__(daemon=True)
        self._heartbeat_interval = heartbeat_interval
        self._heartbeat_host_schedule: Scheduler = Scheduler()
        self._channel_job: Optional[ChannelJobExecutor] = None
        self._total_process_num = 1
        self._current_process_idx = 0
        self._pid = pid

    def _initializer(self):
        # 1. Init channel_job
        self._channel_job = ChannelJobExecutor()
        self._channel_job.init_config(settings.SYSOM_HOST_CEC_URL).start()

        # 2. Get total process num and idx
        try:
            # Example as follow: <idx> <>
            # 0 2575977
            # 1 2575978
            # 2 2575979
            # 3 2575980
            ret = subprocess.run(
                "supervisorctl status | grep sysom-api | awk '{print $1\" \"$4}' | awk -F\",\" '{print $1}' | awk -F\":\" '{print $NF}'",
                stdout=subprocess.PIPE, encoding="utf-8", shell=True
            )

            if ret.returncode == 0:
                processes = ret.stdout.strip().split("\n")
                self._total_process_num = len(processes)
                for process_info in processes:
                    infos = process_info.split(' ')
                    if len(infos) >= 2 and int(infos[1]) == self._pid:
                        self._current_process_idx = int(infos[0])
                        break
        except Exception as exc:
            logger.error(f"Get process num and idx faild: {str(exc)}")

    def _register_task(self):
        queryset = HostModel.objects.filter(status__in=[0, 2])
        if len(queryset) == 0:
            logger.debug('No node!')
            return
        for idx, instance in enumerate(queryset):
            # Each process handles part of the heartbeat task.
            if idx % self._total_process_num == self._current_process_idx:
                self._send_host_heart_beat(instance)

    def run(self) -> None:
        logger.info(f'守护进程PID: {self.pid}')
        self._heartbeat_host_schedule.every(self._heartbeat_interval)\
            .seconds.do(self._register_task)

        self._initializer()
        while True:
            if self.is_alive():
                self._heartbeat_host_schedule.run_pending()
            else:
                break
            time.sleep(max(1, int(self._heartbeat_interval / 2)))

    def _send_host_heart_beat(self, instance: HostModel) -> None:
        """
        向机器发送'ls'命令，判断机器是否在线, 如果
        执行失败，更新主机状态为‘离线’
        """
        # logger.info(f'检查机器: IP {instance.ip} 心跳')
        logger.opt(lazy=True).info(f'检查机器: IP {instance.ip} 心跳')

        cmd = r"""
        uname -r && cat /etc/system-release
        """
        params = dict()
        params['params'] = {
            "instance": instance.ip,
            "command": cmd
        }
        params['timeout'] = self._heartbeat_interval * 1000
        params['auto_retry'] = True

        self._channel_job.dispatch_job(**params)\
            .execute_async_with_callback(
                finish_callback=functools.partial(self._finish_callback, instance))

    def _finish_callback(self, instance: HostModel, res: JobResult):
        status = 0 if res.code == 0 else 2
        host_info = dict()

        try:
            if instance.status != status:
                instance.status = status
            if status == 0:
                results = res.result.split('\n')
                if len(results) > 2:
                    host_info['release'] = results[1]
                    host_info['kernel_version'] = results[0]
                    instance.host_info = json.dumps(host_info)
            # force_update => Use SQL's update statement to update
            # It can avoid the bug that the host will be inserted again
            # when it is deleted.
            instance.save(force_update=True)
        except Exception as e:
            logger.error(str(e))
        finally:
            connection.close()
