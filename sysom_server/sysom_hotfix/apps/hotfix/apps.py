from loguru import logger
from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.conf import settings
from cec_base.admin import dispatch_admin


class HotfixConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hotfix'

    def ready(self):
        try:
            hotfix_cec_topic_name = "hotfix_job"
            post_migrate.connect(initialization_subscribe, sender=self)
            admin = dispatch_admin(settings.SYSOM_CEC_URL)
            if admin.create_topic(hotfix_cec_topic_name):
                logger.info(">>>>>>>> INIT_HOTFIX_VIEW : create hotfix_job cec topic success")
        except Exception as e:
            logger.info(str(e))
            logger.info(">>>>>>>> INIT_HOTFIX_VIEW : create hotfix_job cec topic failed")
        logger.info(">>> hotfix module loading success")


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