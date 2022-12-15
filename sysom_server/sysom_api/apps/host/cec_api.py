from loguru import logger
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask
from cec_base.event import Event
from cec_base.consumer import Consumer
from django.conf import settings
from .models import HostModel


class HostCecApi(MultiConsumer):
    def __init__(self):
        super().__init__(settings.SYSOM_CEC_URL, custom_callback=self._on_receive_event)
        self.append_group_consume_task(
            settings.SYSOM_CEC_API_HOST_TOPIC,
            settings.SYSOM_CEC_API_HOST_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self._opt_table = {
            "update_host_status_by_ip": self._update_host_status_by_ip
        }

    def _on_receive_event(self, event: Event, task: CecAsyncConsumeTask):
        """Process received event"""
        try:
            if task.topic_name == settings.SYSOM_CEC_API_HOST_TOPIC:
                self._process_cec_api_event(event)
            else:
                # Unexpected
                logger.error("Receive unknown topic event, unexpected!!")
        except Exception as exc:
            logger.exception(exc, exc_info=True)
        finally:
            task.ack(event)

    def _process_cec_api_event(self, event: Event):
        """HOST cec api dispatcher
        request body:
        {
            "type": "update_host_status_by_ip",
            "params": {
                "ip": "xxx",
                "status": "xxx"
            }
        }
        """
        if not isinstance(event.value, dict):
            raise Exception(
                f"HOST cec api required a event value of type dict, but received '{type(event.value)}'")
        api_type = event.value.get("type", "Unknown")
        params = event.value.get("params", {})
        if api_type not in self._opt_table:
            logger.warning(f"HostCecApi received unsupported {api_type}")
            return
        self._opt_table[api_type](params)

    def _update_host_status_by_ip(self, params: dict):
        """Update host status by ip

        Args:
            params(dict): Request params
                {
                    "ip": "xxx",
                    "status": "xxx"
                }
        """
        ip = params.get("ip", "unknown")
        status = params.get("status", None)
        if status is None:
            raise Exception(
                f"Host cec api: update_host_status_by_ip missing params 'status'")
        host_instance = HostModel.objects.filter(ip=ip).first()
        if host_instance is None:
            raise Exception(
                f"Host cec api: Not found such host with ip = {ip}")
        host_instance.status = status
        host_instance.save()
