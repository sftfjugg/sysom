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
        # write key to file
        write_key_to_file()
        logger.info(">>> Channel module loading success")

def write_key_to_file():
    try:
        from .models import SettingsModel
        from django.conf import settings

        instance = SettingsModel.objects.get(key='ssh_key')
        if instance:
            with open(settings.KEY_PATH, 'w') as f:
                f.write(instance.value)
    except Exception as e:
        logger.error(e)
        pass

def initialization_settings(sender, **kwargs):
    init_model()


def init_model():
    try:
        from .models import SettingsModel
        from lib.utils import generate_key

        k, v = generate_key()
        ssh_key = json.dumps({"private_key": k, "public_key": v})
        SettingsModel.objects.create(key='ssh_key', value=ssh_key, description='系统自动生成公私匙')
    except Exception as e:
        pass
