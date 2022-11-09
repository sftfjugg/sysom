import json
import logging
import sys
from django.apps import AppConfig
from django.db.models.signals import post_migrate


logger = logging.getLogger(__name__)


class ChannelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.channel'

    def ready(self):
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程

            # 2. Read key pair from database then save as file
            export_key_pair()

            # 3. Start channel listener
            start_channel_listener()
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            # 1. Perform the necessary initialization operations when the
            #    database is changed
            post_migrate.connect(on_post_migrate, sender=self)

        logger.info(">>> Channel module loading success")


def on_post_migrate(sender, **kwargs):
    """Invoke after migrate successful"""

    # 1. Try to auto generate a pair of SSH key used to connect remote node
    try:
        from .models import ChannelSettingModel
        from lib.utils import generate_key

        k, v = generate_key()
        ssh_key = json.dumps({"private_key": k, "public_key": v})
        ChannelSettingModel.objects.create(
            name="ssh_key", value=ssh_key, description="SysOM Channel auto generated key")
    except Exception as exc:
        # logger.exception(exc)
        pass


def export_key_pair():
    """Export key pair as file
    """
    from django.conf import settings
    from .models import ChannelSettingModel
    from lib.ssh import SSH

    def private_key_getter() -> str:
        result = ""
        with open(settings.SSH_CHANNEL_KEY_PRIVATE) as f:
            result = f.read()
        return result

    def public_key_getter() -> str:
        result = ""
        with open(settings.SSH_CHANNEL_KEY_PUB) as f:
            result = f.read()
        return result

    try:
        instance = ChannelSettingModel.objects.get(name="ssh_key")
        key_pair = json.loads(instance.value)

        # 1. Export private key
        # TODO: The exported secret key needs to be encrypted here
        with open(settings.SSH_CHANNEL_KEY_PRIVATE, 'w') as f:
            f.write(key_pair["private_key"])

        # 2. Export public key
        with open(settings.SSH_CHANNEL_KEY_PUB, "w") as f:
            f.write(key_pair["public_key"])

        # 3. Set SSH key getter
        SSH.set_private_key_getter(private_key_getter)
        SSH.set_public_key_getter(public_key_getter)

    except Exception as exc:
        logger.exception(exc)


def start_channel_listener():
    if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
        from cec_base.log import LoggerHelper, LoggerLevel
        from apps.channel.executor import ChannelListener

        LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
        # 这边微服务正式启动的时候执行一些处理代码
        # 启动任务结果处理线程
        try:
            ChannelListener().start()
        except Exception as e:
            logger.exception(e)
    else:
        # 这边执行数据库迁移等操作的时候执行一些处理代码
        pass
    pass
