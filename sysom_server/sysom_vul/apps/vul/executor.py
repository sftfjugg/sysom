from loguru import logger
from django.conf import settings
from cec_base.event import Event
from cec_base.consumer import Consumer
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask
from apps.host.models import HostModel


class VulListener(MultiConsumer):
    def __init__(self):
        super().__init__(settings.SYSOM_CEC_URL, custom_callback=self.on_receive_event)
        self.append_group_consume_task(
            settings.SYSOM_CEC_PLUGIN_TOPIC,
            settings.SYSOM_CEC_VUL_CONSUMER_GROUP,
            consumer_id=Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )

    def on_receive_event(self, event: Event, task: CecAsyncConsumeTask):
        """Process received event"""
        try:
            if event.value.get("type", "") == "clean":
                params = event.value.get('params')
                self._delete_host_instance(params['instance'])
        finally:
            task.ack(event)

    def _delete_host_instance(self, ip: str):
        """delete host"""
        try:
            instance = HostModel.objects.get(ip=ip)
            instance.delete()
        except HostModel.DoesNotExist:
            logger.error(f'host ip {ip} not exist!')
