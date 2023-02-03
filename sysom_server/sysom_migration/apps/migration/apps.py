import sys
import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class MigrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.migration'

    def ready(self):
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from cec_base.log import LoggerHelper, LoggerLevel
            from channel_job.job import default_channel_job_executor
            LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)

            # 初始化 channel_job sdk
            config_url = f'{settings.SYSOM_CHANNEL_URL}/api/v1/channel/config/get?name=migration_setting'
            default_channel_job_executor.initial_from_remote_server(config_url)
            default_channel_job_executor.start()

        logger.info(">>> Migration module loading success")
