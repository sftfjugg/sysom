import sys
import os
from loguru import logger
from django.apps import AppConfig
from channel_job import default_channel_job_executor


class HostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.host'

    def ready(self):
        if 'runserver' in sys.argv or 'manage.py' not in sys.argv:
            from django.conf import settings
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            default_channel_job_executor.init_config(
                settings.SYSOM_HOST_CEC_URL).start()
            try:
                from .heartbeat import HeartBeat, HeartBeatProcess
                # HeartBeat.start()
                HeartBeatProcess(pid=os.getpid()).start()
            except Exception as e:
                logger.warning(f'主机心跳未启动: {e}')
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Host module loading success")
