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
import anyio
import requests
import json
import time
# from schedule import Scheduler
from cec_base.consumer import Consumer, dispatch_consumer
from cec_base.producer import Producer, dispatch_producer
from cec_base.admin import Admin, dispatch_admin
from cec_base.event import Event
from cec_base.url import CecUrl
from cec_base.utils import StoppableThread
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

        # # timeout check scheduler
        # self._timeout_task_scheduler = Scheduler()

    def execute(
        self, chunk_callback: Callable[[JobResult], None] = None,
        **kwargs
    ) -> JobResult:
        """Get results by synchronization

        Args:
            chunk_callback(Callable[[JobResult], None]): A callback function that is 
            called every time a return result is received and can be used to fetch 
            streaming data.

        Raises:
            ChannlJobException: Unexpected errors occur during job execution

        """
        # 1. Bind optional chunk callback
        self._chunk_callback = chunk_callback

        self.job_entry.timeout = kwargs.get("timeout", self.job_entry.timeout)
        timeout = self.job_entry.timeout

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

    async def execute_async(
        self, chunk_callback: Callable[[JobResult], None] = None
    ) -> JobResult:
        """Execute channel by asynchronous

        Args:
            chunk_callback(Callable[[JobResult], None]): A callback function that is
        """
        return await anyio.to_thread.run_sync(
            self.execute, chunk_callback
        )

    def execute_async_with_callback(
        self,
        finish_callback: Callable[[JobResult], None],
        chunk_callback: Callable[[JobResult], None] = None,
    ):
        """Get results by asynchronous with callback

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
        if self._chunk_callback is not None:
            entry.return_as_stream = True
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
        def invoke_chunk_callback(result: JobResult):
            if self._chunk_callback is not None:
                self._chunk_callback(result)

        if result.is_finished:
            if len(self._results) <= 0:
                self._results.append(result)
                invoke_chunk_callback(result)
            self._final_result = result
            with self._finish_conn:
                self._finish_conn.notify()
            if self._finish_callback is not None:
                self._finish_callback(result)
        else:
            invoke_chunk_callback(result)
            self._results.append(result)


class ChannelFileJob:
    _OPT_TABLE = {
        "send-file": "/api/v1/channel/file/send",
        "get-file": "/api/v1/channel/file/get"
    }

    def __init__(
        self, base_url: str,
        opt: str = "send-file",
        local_path: str = "",
        remote_path: str = "",
        instances: List[str] = [],
        instance: str = "",
    ) -> None:
        self.base_url: str = base_url
        self.opt: str = opt
        self.local_path: str = local_path
        self.remote_path: str = remote_path
        self.instances: str = instances
        self.instance = instance

    def _send_file(self) -> JobResult:
        url = f"{self.base_url}{self._OPT_TABLE[self.opt]}"
        payload = {
            "target_path": self.remote_path,
            "target_instances": ";".join(self.instances)
        }
        files = [
            ('file', (self.local_path, open(
                self.local_path, 'rb'), 'application/octet-stream'))
        ]
        headers = {
            'User-Agent': 'sysom_channel_job/1.0.0'
        }
        response = requests.request(
            "POST", url, headers=headers, data=payload, files=files)
        if response.status_code != 200:
            return JobResult(
                code=1,
                err_msg=f"{response.reason}: {response.text}",
                result=response.text
            )
        channel_result = response.json()
        return JobResult(
            code=channel_result.get("code", 1),
            err_msg=channel_result.get("err_msg", "Unknown error"),
            result=json.dumps(channel_result.get("result", []))
        )

    def _get_file(self) -> JobResult:
        url = f"{self.base_url}{self._OPT_TABLE[self.opt]}"
        payload = {
            "target_instance": self.instance,
            "remote_path": self.remote_path,
        }
        headers = {
            'User-Agent': 'sysom_channel_job/1.0.0',
            'Content-Type': 'application/json'
        }
        with requests.get(url, headers=headers, data=json.dumps(payload)) as r:
            with open(self.local_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024*1024):
                    if chunk:
                        f.write(chunk)
            if r.status_code == 200:
                return JobResult(
                    code=0,
                    result=""
                )
            else:
                return JobResult(
                    code=1,
                    err_msg=r.text,
                    result=""
                )

    def execute(self) -> JobResult:
        if self.opt == "send-file":
            return self._send_file()
        elif self.opt == "get-file":
            return self._get_file()

    async def execute_async(self) -> JobResult:
        return anyio.to_thread.run_sync(self.execute)


class ChannelJobExecutorConfig:
    def __init__(self, host: str = "") -> None:
        pass


class ChannelJobExecutor:

    def __init__(self) -> None:
        self._consumer: Optional[Consumer] = None
        self._producer: Optional[Producer] = None
        self._admin: Optional[Admin] = None
        self._target_topic = ""
        self._listen_topic = ""
        self._channel_base_url = ""
        self._auto_recover = True
        self._job_mapper: Dict[str, ChannelJob] = {

        }
        # _stop_event used to
        self._job_executor_thread: Optional[StoppableThread] = None

    def initial_from_remote_server(self, channel_server_url: str):
        """Auto initial ChannelJobExecutor

        1. First pull the configuration from the remote server;
        2. Automatic initialization based on the configuration returned by the server

        Args:
            channel_server_url(str): Channel server http url
        """
        # 1. First pull config from server
        try:
            response = requests.get(channel_server_url)
            if response.status_code == 200:
                configs = json.loads(response.json()["data"])
                self.init_config(**configs)
                pass
            else:
                raise ChannelJobException(
                    f"Request config from {channel_server_url} failed: {response.status_code}")
        except Exception as e:
            raise ChannelJobException(e)

    def init_config(
        self, cec_url: str, channel_base_url: str = "http://127.0.0.1:7003"
    ):
        cec_url = CecUrl.parse(cec_url)
        self._channel_base_url = channel_base_url

        # 1. Check require params
        self._target_topic = cec_url.params.pop(
            "channel_job_target_topic", None
        )
        self._listen_topic = cec_url.params.pop(
            "channel_job_listen_topic", None
        )
        listen_consumer_group = cec_url.params.pop(
            "channel_job_consumer_group", None
        )
        self._auto_recover = cec_url.params.pop(
            "channel_job_auto_recover", True
        )
        if None in [self._target_topic, self._listen_topic, listen_consumer_group]:
            raise (ChannelJobException("CecUrl missing parameters"))

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
                     params: dict = {}, echo: dict = {}, **kwargs) -> ChannelJob:
        """Dispatch one channel job to channel services

        Args:
            channel_type(str): The type of channel used to execute job
            channel_opt(str): The operation type, eg.: cmd, init
            params(dict): Channl job parameters
            echo(dict): Echo information

        Keyword Args:
            timeout: The maximum time to wait for a channel job to
                     execute. (ms)
            auto_retry: If the channel is not established successfully, it is
                        automatically retried before the timeout period expires.
        """
        # 1. Generate JobEntry
        job_entry = JobEntry(
            channel_type=channel_type, channel_opt=channel_opt,
            params=params, echo=echo, listen_topic=self._listen_topic,
            **kwargs
        )

        # 2. Cache job instance, used to trigger callback while result received
        channel_job = ChannelJob(job_entry)
        channel_job._bind_producer(self._producer, self._target_topic)
        self._job_mapper[job_entry.job_id] = channel_job
        return channel_job

    def dispatch_file_job(self, opt: str = "send-file", params: dict = {}) -> ChannelFileJob:
        return ChannelFileJob(base_url=self._channel_base_url, opt=opt, **params)

    def _deal_received_event(self, event: Event):
        job_result = JobResult.parse_by_cec_event_value(event.value)
        if job_result.job_id in self._job_mapper:
            self._job_mapper[job_result.job_id]._update_chunk(job_result)

    def _run(self):
        while self._job_executor_thread is not None and \
                not self._job_executor_thread.stopped():
            for event in self._consumer:
                # deal each event
                self._deal_received_event(event)
            if self._job_executor_thread is not None and \
                    not self._job_executor_thread.stopped():
                time.sleep(5)

    def start(self):
        if self._job_executor_thread is None or \
                self._job_executor_thread.stopped():
            self._job_executor_thread = StoppableThread(
                target=self._run, daemon=True
            )
            self._job_executor_thread.start()

    def stop(self):
        self._job_executor_thread.stop()
        self._consumer.disconnect()
        self._producer.disconnect()
        self._admin.disconnect()
        self._job_executor_thread.join()


default_channel_job_executor = ChannelJobExecutor()
