import logging
import sys
from django.apps import AppConfig
from sdk.cec_base.cec_client import CecClient
from sdk.cec_base.consumer import Consumer
from sdk.cec_base.event import Event

logger = logging.getLogger(__name__)


def _on_receive_task_result(consumer: Consumer, event: Event, task: dict):
    """Host module deal task result here

    {
        "status":0,
        "err_msg":"",
        "task": {}
    }
    """
    from .models import HostModel
    try:
        result = event.value
        status = result.get("status", 1)
        task = result.get("task", {})
        params = task.get("params", {})
        service_name = params.get("service_name", "Unknown")
        if service_name != "node_init":
            return
        instance_ip = params.get("instance", "Unknown")
        instance = HostModel.objects.get(ip=instance_ip)
        instance.status = status
        instance.save()
    except Exception as exc:
        logger.exception(exc)
    finally:
        consumer.ack(event)


class HostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.host'

    def ready(self):
        if 'runserver' in sys.argv or 'manage.py' not in sys.argv:
            from django.conf import settings
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            try:
                cec_client = CecClient(settings.SYSOM_CEC_URL, custom_callback=_on_receive_task_result)
                cec_client.append_group_consume_task(
                    settings.SYSOM_CEC_TASK_EXECUTE_RESULT_TOPIC,
                    settings.SYSOM_CEC_TASK_RESULT_LISTENER_HOST_GROUP
                )
                cec_client.start()
            except Exception as e:
                logger.exception(e)
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Host module loading success")
