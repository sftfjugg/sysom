import logging
import functools
from apps.task.models import JobModel
from django.conf import settings
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask
from cec_base.event import Event
from cec_base.consumer import Consumer
from channel_job import JobResult
from .helper import DiagnosisHelper

logger = logging.getLogger(__name__)


class DiagnosisTaskExecutor(MultiConsumer):

    def __init__(self):
        super().__init__(settings.SYSOM_CEC_URL, custom_callback=self.on_receive_event)
        self.append_group_consume_task(
            settings.SYSOM_CEC_PLUGIN_TOPIC,
            settings.SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self.append_group_consume_task(
            settings.SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC,
            settings.SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )

    def on_receive_event(self, event: Event, task: CecAsyncConsumeTask):
        """Process received event"""
        try:
            if task.topic_name == settings.SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC:
                self._process_task_dispatch_event(event)
            elif task.topic_name == settings.SYSOM_CEC_PLUGIN_TOPIC:
                self._process_plugin_event(event)
            else:
                # Unexpected
                logger.error("Receive unknown topic event, unexpected!!")
        except Exception as exc:
            logger.exception(exc, exc_info=True)
        finally:
            task.ack(event)

    ################################################################################################
    # 事件处理
    ################################################################################################
    def _process_plugin_event(self, event: Event):
        """Process plugin event
        {
            "type": "clean",
            "params": {
                "channel": "ssh",
                "host": instance.ip,
                "username": instance.username,
                "port": instance.port
            },
            "echo": {
                "instance": params.get("host", "Unknown host"),
                "label": "host_init"
            }
        }
        """
        from lib.authentications import decode_token
        try:
            value = event.value
            plugin_event_type = value.get("type", "Unknown type")
            params = value.get("params", {})
            token = params.pop("token", "")

            if plugin_event_type == "init":
                params["service_name"] = "node_init"
            elif plugin_event_type == "clean":
                params["service_name"] = "node_delete"
            else:
                raise Exception(f"Receive not supprt plugin event: {event}")

            user = decode_token(token)
            # 1. Perform init
            instance = DiagnosisHelper.init(params, user)

            # 2. Execute diagnosis task
            self._execute_diagnosis_task_by_model(instance)
        except Exception as exc:
            logger.error(
                f"Diagnosis process plugin event error: {str(exc)}", exc_info=True)

    def _process_task_dispatch_event(self, event: Event):
        """Process diagnosis task dispatch event
        {
            "task_id": "xxx"
        }
        """
        try:
            self._execute_diagnosis_task_by_id(event.value["task_id"])
        except Exception as exc:
            logger.error(
                f"Diagnosis process task dispatch event error: {str(exc)}", exc_info=True)

    ################################################################################################
    # 诊断任务执行
    ################################################################################################

    def _execute_diagnosis_task_by_id(self, task_id: str):
        instance = JobModel.objects.get(task_id=task_id)
        self._execute_diagnosis_task_by_model(instance)

    def _execute_diagnosis_task_by_model(self, instance: JobModel):
        # 1. Preprocess
        res = DiagnosisHelper.preprocess(instance)

        # 2. Execute and Postprocess
        if res:
            res = DiagnosisHelper.execute(
                instance,
                functools.partial(DiagnosisHelper.postprocess, instance)
            )

        # 3. TODO: produce task execute result to cec
