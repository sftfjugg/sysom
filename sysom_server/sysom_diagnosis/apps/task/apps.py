import logging
import sys
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class TaskConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.task'

    def ready(self):
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from cec_base.log import LoggerHelper, LoggerLevel
            from apps.task.executors import TaskDispatcher
            LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            try:
                TaskDispatcher(
                    settings.SYSOM_CEC_URL,
                ).start_dispatcher()
            except Exception as e:
                logger.exception(e)
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Diagnosis module loading success")
