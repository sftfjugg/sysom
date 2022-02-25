import logging
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class AlarmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.alarm'

    def ready(self):
        logger.info(">>> alarm module loading success")
