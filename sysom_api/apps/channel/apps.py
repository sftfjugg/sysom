import json
import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate


logger = logging.getLogger(__file__)


class ChannelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.channel'

    def ready(self) -> None:
        post_migrate.connect(initialization_settings, sender=self)
        logger.info(">>> Accounts module loading success")


def initialization_settings(sender, **kwargs):
    init_model()


def init_model():
    try:
        from .models import SettingsModel
        from lib.ssh import SSH

        k, v = SSH.generate_key()
        ssh_key = json.dumps({"private_key": k, "public_key": v})
        SettingsModel.objects.create(key='ssh_key', value=ssh_key, description='系统自动生成公私匙')
    except Exception as e:
        print(e)
