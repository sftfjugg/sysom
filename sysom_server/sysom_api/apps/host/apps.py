import logging
import sys
from django.apps import AppConfig
from cec_base.cec_client import CecClient
from cec_base.consumer import Consumer
from cec_base.producer import Producer
from cec_base.event import Event

logger = logging.getLogger(__name__)


def _on_receive_task_result(consumer: Consumer, producer: Producer, event: Event, task: dict):
    """Host module deal task result here

    {
        "code": 0,
        "err_msg": "",
        "result": "xxx",
        "echo": {
            "instance": "127.0.0.1"
            "label": "host_init"
        }
    }
    """
    from .models import HostModel
    from apps.alarm.views import _create_alarm_message
    from datetime import datetime
    from django.conf import settings
    
    try:
        result = event.value
        code = result.get("code", 1)
        err_msg = result.get("err_msg", "")
        echo = result.get("echo", {})
        label = echo.pop("label", "")
        if label == "host_init":
            instance_ip = echo.pop("instance", "")
            instance = HostModel.objects.get(ip=instance_ip)
            instance.status = 0 if code == 0 else 1
            instance.save()
            alarm_msg = {
                "sub": 1,
                "item": "host"
            }
            if code == 0:
                alarm_msg['message'] = f"Host: {instance_ip} init success!"
                alarm_msg['collected_time'] = datetime.now().strftime(
                    '%Y-%m-%d %H:%M:%S')
                alarm_msg['level'] = 3
                _create_alarm_message(alarm_msg)
                
                # 主机添加成功通知插件初始化
                producer.produce(
                    settings.SYSOM_CEC_PLUGIN_TOPIC,
                    {
                        "type": "init",
                        "params": {
                            "channel": "ssh",
                            "instance": instance.ip,
                            "username": instance.username,
                            "port": instance.port,
                            "token": echo.pop("token", "")
                        }
                    }
                )
            else:
                alarm_msg['message'] = f"Host: {instance_ip} init failed: {err_msg}"
                alarm_msg['collected_time'] = datetime.now().strftime(
                    '%Y-%m-%d %H:%M:%S')
                alarm_msg['level'] = 2
                _create_alarm_message(alarm_msg)
    except Exception as exc:
        logger.exception(exc)
        err_msg += str(exc)
    finally:
        consumer.ack(event)
        


class HostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.host'

    def ready(self):
        if 'runserver' in sys.argv or 'manage.py' not in sys.argv:
            from django.conf import settings
            from cec_base.log import LoggerHelper, LoggerLevel
            # 这边微服务正式启动的时候执行一些处理代码
            # 启动任务结果处理线程
            LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
            try:
                cec_client = CecClient(settings.SYSOM_CEC_URL, custom_callback=_on_receive_task_result)
                cec_client.append_group_consume_task(
                    settings.SYSOM_CEC_CHANNEL_RESULT_TOPIC,
                    settings.SYSOM_CEC_API_HOST_CONSUMER_GROUP,
                    ensure_topic_exist=True
                )
                cec_client.start()
            except Exception as e:
                logger.exception(e)
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Host module loading success")
