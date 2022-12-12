import sys
from loguru import logger
from django.apps import AppConfig


class TaskConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.task'

    def ready(self):
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from apps.task.executor import DiagnosisTaskExecutor
            from channel_job.job import default_channel_job_executor

            # 初始化 channel_job sdk
            default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
            default_channel_job_executor.start()

            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            try:
                DiagnosisTaskExecutor().start()
            except Exception as e:
                logger.exception(e)
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Diagnosis module loading success")
