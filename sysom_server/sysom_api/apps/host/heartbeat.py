import functools
from typing import Optional
from threading import Thread
from schedule import Scheduler
from loguru import logger
from .models import HostModel
from channel_job import ChannelJobExecutor
from django.db import connection
from django.conf import settings


class HeartBeat:
    """
    A daemon thread/process use to send the heartbeat of host
    """

    def __init__(self, heartbeat_interval: int = 5) -> None:
        self._heartbeat_interval = heartbeat_interval
        self._heartbeat_listen_thread: Optional[Thread] = None
        self._heartbeat_host_schedule: Scheduler = Scheduler()
        
        self._channel_job = ChannelJobExecutor()
        self._channel_job.init_config(settings.SYSOM_HOST_CEC_URL).start()

    def _send_host_heart_beat(self, instance: HostModel) -> None:
        """
        向机器发送'ls'命令，判断机器是否在线, 如果
        执行失败，更新主机状态为‘离线’
        """
        # logger.info(f'检查机器: IP {instance.ip} 心跳')
        logger.opt(lazy=True).info(f'检查机器: IP {instance.ip} 心跳')

        params = dict()
        params['params'] = {
            "instance": instance.ip,
            "command": "ls"
        }
        params['timeout'] = 5000
        params['auto_retry'] = True

        self._channel_job.dispatch_job(**params)\
            .execute_async_with_callback(
                finish_callback=functools.partial(self._finish_callback, instance))

    def _finish_callback(self, instance, res):
        if instance.status == res.code == 0:
            ...
        else:
            status = 0 if res.code == 0 else 2
            try:
                instance.status = status
                instance.save()
            except Exception as e:
                logger.error(str(e))
            finally:
                connection.close()

    def _task(self):
        queryset = HostModel.objects.exclude(status=1)
        for instance in queryset:
            self._send_host_heart_beat(instance)

    def _run(self):
        while self._heartbeat_listen_thread.is_alive():
            self._heartbeat_host_schedule.run_pending()

    @classmethod
    def start(cls, heartbeat_interval: int = 5):
        logger.info('heart beat of host work start!')
        instance = cls(heartbeat_interval=heartbeat_interval)

        instance._heartbeat_host_schedule.every(instance._heartbeat_interval)\
            .seconds.do(instance._task)

        if instance._heartbeat_listen_thread is not None and\
                instance._heartbeat_listen_thread.is_alive():
            return False
        else:
            instance._heartbeat_listen_thread = Thread(target=instance._run)
            instance._heartbeat_listen_thread.setDaemon(True)
            instance._heartbeat_listen_thread.start()
            return True
