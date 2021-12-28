import logging
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class JobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.task'

    def ready(self):
        logger.info(">>> Job module loading success")
