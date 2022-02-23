import logging
from django.apps import AppConfig

from django.db.models.signals import post_migrate


logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self) -> None:
        post_migrate.connect(initialization_account, sender=self)
        logger.info(">>> Accounts module loading success")


def initialization_account(sender, **kwargs):
    load_account_models_data()


def load_account_models_data():
    try:
        from .models import User, Role
        if Role.objects.all().count() == 0:
            role_list = [
                Role(role_name="管理员"),
                Role(role_name="运维人员"),
                Role(role_name="普通人员")
            ]

            Role.objects.bulk_create(role_list, batch_size=100)

        if not  User.objects.filter().first():
            acc = User.objects.create(
                username="admin",
                password="pbkdf2_sha256$260000$l7J8CLGVx5TOroHqIrm8Ml$7xshVn1wHfCAeYYNZKHBo7B8bGfklfcKqmhpun6ARSk=",
                is_admin=True,
                is_agree=True,
                description="系统管理员"
                )
            acc.role.add(*[1,])
            acc.save()
    except Exception as e:
        pass