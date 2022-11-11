# -*- coding: utf-8 -*- #
"""
Time                2022/11/7 14:16
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                job.py
Description:
"""
from typing import Optional, Callable, List, Dict
import threading
from cec_base.consumer import Consumer, dispatch_consumer
from cec_base.producer import Producer, dispatch_producer
from cec_base.admin import Admin, dispatch_admin
from cec_base.event import Event
from cec_base.url import CecUrl
from cec_base.exceptions import TopicAlreadyExistsException
from .model import JobEntry, JobResult
from .exception import ChannelJobException
from .exception import ChannelJobException
from .model import JobEntry, JobResult


class ChannelJob:
    """A channel job class

    This class used to describe a channel job, support for obtaining the execution 
    results of channel jobs by synchronous or asynchronous means

    Args:
        entry(JobEntry): Request parameters for channel job
    """

    def __init__(self, entry: JobEntry) -> None:
        self.job_entry: JobEntry = entry
        self._chunk_callback: Optional[Callable[[JobResult], None]] = None
        self._finish_callback: Optional[Callable[[JobResult], None]] = None
        self._producer: Optional[Producer] = None
        self._target_topic = ""

        # A list to collect each result chunk
        # if _then_callback is None, it's not necessary to collect result chunk
        self._results: List[JobResult] = []
        self._final_result: Optional[JobResult] = None
        self._finish_conn: threading.Condition = threading.Condition()

    def execute(self, chunk_callback: Callable[[JobResult], None] = None, timeout: int = None) -> JobResult:
        """Get results by synchronization

        Args:
            chunk_callback(Callable[[JobResult], None]): A callback function that is 
            called every time a return result is received and can be used to fetch 
            streaming data.
            timeout(int): Maximum waiting time in millisecond

        Raises:
            ChannlJobException: Unexpected errors occur during job execution

        """
        # 1. Bind optional chunk callback
        self._chunk_callback = chunk_callback

        with self._finish_conn:
            # 2. Delivery job to CEC
            self._delivery_to_cec(self.job_entry)

            # 3. Wait job result by synchronization
            if self._finish_conn.wait(None if timeout is None else timeout / 1000):
                return self._final_result
            else:
                self._final_result = JobResult(
                    code=1,
                    err_msg="Execute job timeout",
                    result="",
                    echo=self.job_entry.echo
                )
            return self._final_result

    def execute_async(
        self,
        finish_callback: Callable[[JobResult], None],
        chunk_callback: Callable[[JobResult], None] = None,
    ):
        """Get results by asynchronous

        """
        self._finish_callback = finish_callback
        self._chunk_callback = chunk_callback
        self._delivery_to_cec(self.job_entry)

    #################################################################################
    # Inner funtions
    #################################################################################
    def _bind_producer(self, producer: Producer, target_topic: str):
        """Bind cec producer used to delivery event to CEC"""
        self._producer = producer
        self._target_topic = target_topic

    def _delivery_to_cec(self, entry: JobEntry):
        """Delivery channel job to cec

        Generate event based on ChannelJob and delivery it to CEC

        Args:
            entry(JobEntry): Channel job entry
        """
        if self._producer is None or self._target_topic == "":
            raise ChannelJobException(
                "ChannelJob not bind producer or target_topic")
        try:
            # 3. Delivery event to cec
            self._producer.produce(
                self._target_topic, entry.to_channel_vlaue())
            self._producer.flush()
        except Exception as exc:
            raise ChannelJobException(exc)

    def _update_chunk(self, result: JobResult):
        """Invoke each chunk is received"""
        if self._chunk_callback is not None:
            self._chunk_callback(result)
        self._results.append(result)
        if result.is_finished:
            # Job is finished and no exception has been thrown, collect all result
            final_result: JobResult = JobResult.parse_by_other_job_result(result)
            final_result.result = ""
            final_result.err_msg = ""
            for chunk in self._results:
                final_result.result += chunk.result
                final_result.err_msg += chunk.err_msg
            self._final_result = final_result
            with self._finish_conn:
                self._finish_conn.notify()
            if self._finish_callback is not None:
                self._finish_callback(final_result)


class ChannelJobExecutor:

    def __init__(self, url: Optional[str] = None) -> None:
        self._consumer: Optional[Consumer] = None
        self._producer: Optional[Producer] = None
        self._admin: Optional[Admin] = None
        self._target_topic = ""
        self._listen_topic = ""
        self._job_mapper: Dict[str, ChannelJob] = {

        }
        if url is not None:
            self.init_config(url)

    def init_config(self, url: str):
        cec_url = CecUrl.parse(url)

        # 1. Check require params
        self._target_topic = cec_url.params.pop(
            "channel_job_target_topic", None)
        self._listen_topic = cec_url.params.pop(
            "channel_job_listen_topic", None)
        listen_consumer_group = cec_url.params.pop(
            "channel_job_consumer_group", None)
        if None in [self._target_topic, self._listen_topic, listen_consumer_group]:
            raise(ChannelJobException("CecUrl missing parameters"))

        # 2. Create Consumer, Producer, Admin instance
        self._consumer: Consumer = dispatch_consumer(
            str(cec_url), self._listen_topic, Consumer.generate_consumer_id(),
            start_from_now=True
        )
        self._producer: Producer = dispatch_producer(str(cec_url))
        self._admin: Admin = dispatch_admin(str(cec_url))

        # 3. ensure topic exists
        self._ensure_topic_exist(self._target_topic)
        self._ensure_topic_exist(self._listen_topic)

        return self

    def _ensure_topic_exist(self, topic: str):
        """A func used to ensure a specific topic exist

        Determine whether the topic exists and create it if it does not

        Args:
            topic(str): Topic Name
        """
        if not self._admin.is_topic_exist(topic):
            try:
                if not self._admin.create_topic(topic):
                    # create_topic failed
                    raise ChannelJobException(f"Topic ${topic} not exists, and"
                                              "the attempt to create failed. ")
            except TopicAlreadyExistsException as _:
                # This func used to ensure topic exists, if it already exists,
                # it is not considered an error to be ignored
                pass

    def dispatch_job(self, channel_type: str = "ssh", channel_opt: str = "cmd",
                     params: dict = {}, echo: dict = {}) -> ChannelJob:
        # 1. Generate JobEntry
        job_entry = JobEntry(
            channel_type=channel_type, channel_opt=channel_opt,
            params=params, echo=echo, listen_topic=self._listen_topic
        )

        # 2. Cache job instance, used to trigger callback while result received
        channel_job = ChannelJob(job_entry)
        channel_job._bind_producer(self._producer, self._target_topic)
        self._job_mapper[job_entry.job_id] = channel_job
        return channel_job

    def _deal_received_event(self, event: Event):
        job_result = JobResult.parse_by_cec_event_value(event.value)
        if job_result.job_id in self._job_mapper:
            self._job_mapper[job_result.job_id]._update_chunk(job_result)

    def _run(self):
        for event in self._consumer:
            # deal each event
            self._deal_received_event(event)

    def start(self):
        threading.Thread(target=self._run, daemon=True).start()

    def stop(self):
        self._consumer.disconnect()
        self._producer.disconnect()
        self._admin.disconnect()


default_channel_job_executor = ChannelJobExecutor()
