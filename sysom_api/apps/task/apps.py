import logging
import sys
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class JobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.task'

    def ready(self):
        if 'runserver' in sys.argv or 'manage.py' not in sys.argv:
            from django.conf import settings
            from sdk.cec_base.consumer import Consumer
            from apps.task.executors import TaskDispatcher
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            try:
                TaskDispatcher(
                    settings.SYSOM_CEC_URL,
                ).start_dispatcher(settings.SYSOM_CEC_TASK_RESULT_PROCESS_TOPIC,
                                   Consumer.generate_consumer_id(),
                                   settings.SYSOM_CEC_TASK_RESULT_PROCESS_GROUP)
            except Exception as e:
                logger.exception(e)
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Job module loading success")
