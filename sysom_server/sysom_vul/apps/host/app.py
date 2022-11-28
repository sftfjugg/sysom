from django.apps import AppConfig


class HostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.host'

    def ready(self):
        # logger.info(">>> Host module loading success")
        pass