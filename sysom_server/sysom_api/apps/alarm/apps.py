import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate

logger = logging.getLogger(__name__)


class AlarmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.alarm'

    def ready(self):
        post_migrate.connect(initialization_subscribe, sender=self)
        logger.info(">>> alarm module loading success")

def initialization_subscribe(sender, **kwargs):
    load_subscribe_models_data()


def load_subscribe_models_data():
    try:
        from .models import SubscribeModel

        if not SubscribeModel.objects.filter().first():
            sub = SubscribeModel.objects.create(
                title="admin",
                )
            sub.users.add(*[1,])
            sub.save()
    except Exception as e:
        pass
