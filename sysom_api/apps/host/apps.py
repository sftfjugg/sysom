import logging
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class HostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.host'

    def ready(self):
        logger.info(">>> Host module loading success")