from loguru import logger
import functools
from apps.task.models import JobModel
from django.conf import settings
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask
from cec_base.event import Event
from cec_base.consumer import Consumer
from sysom_utils import ConfigParser
from .helper import DiagnosisHelper


class DiagnosisTaskExecutor(MultiConsumer):

    def __init__(self, config: ConfigParser):
        super().__init__(
            settings.SYSOM_CEC_PRODUCER_URL,
            custom_callback=self.on_receive_event
        )
        self._config = config
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
            else:
                # Unexpected
                logger.error("Receive unknown topic event, unexpected!!")
        except Exception as exc:
            logger.exception(exc)
        finally:
            task.ack(event)

    ################################################################################################
    # 事件处理
    ################################################################################################
    def _process_task_dispatch_event(self, event: Event):
        """Process diagnosis task dispatch event
        {
            "task_id": "xxx"
        }
        """
        try:
            self._execute_diagnosis_task_by_id(event.value["task_id"])
        except Exception as exc:
            logger.exception(
                f"Diagnosis process task dispatch event error: {str(exc)}")

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
