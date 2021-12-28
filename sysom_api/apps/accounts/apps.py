import logging
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self) -> None:
        logger.info(">>> Accounts module loading success")

