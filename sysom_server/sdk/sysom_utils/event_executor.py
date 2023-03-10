# -*- coding: utf-8 -*- #
"""
Time                2023/03/10 13:13
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                executor.py
Description:
"""
import asyncio
import time
from queue import Queue
from typing import Optional, Callable, Awaitable
from loguru import logger
from cec_base.log import LoggerHelper
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask, StoppableThread
from cec_base.event import Event
from cec_base.consumer import Consumer
from channel_job import ChannelJobExecutor
from .config_parser import ConfigParser, CecTarget
from .node_manager import NodeManager


class AsyncEventExecutor(MultiConsumer):
    """ A cec-based event executor


    A cec-based event executor monitor the event from CEC,
    and perform the corresponding response actions while receive one plugin event.
    """

    def __init__(self, cec_url: str, callback: Callable[[Event, CecAsyncConsumeTask], Awaitable[None]],
                 max_task_queue_size: int = 1000):
        super().__init__(cec_url, custom_callback=self.on_receive_event)
        self._callback = callback
        self._task_process_thread: Optional[StoppableThread] = None
        self._task_queue: Queue = Queue(maxsize=max_task_queue_size)

    def on_receive_event(self, event: Event, task: CecAsyncConsumeTask):
        self._task_queue.put(
            self._callback(event, task)
        )

    def _process_task(self):
        def _get_task_from_queue():
            _tasks = []
            while not self._task_queue.empty():
                _task = self._task_queue.get_nowait()
                if _task:
                    _tasks.append(_task)
                else:
                    break
            return _tasks

        if self._task_process_thread is None:
            return

        tasks = _get_task_from_queue()
        loop = asyncio.new_event_loop()
        while not self._task_process_thread.stopped():
            if len(tasks) == 0:
                time.sleep(0.1)
                tasks = _get_task_from_queue()
                continue
            finished, unfinished = loop.run_until_complete(
                asyncio.wait(
                    tasks, return_when=asyncio.FIRST_COMPLETED, timeout=0.5)
            )
            for task in finished:
                if task.exception() is not None:
                    LoggerHelper.get_lazy_logger().error(str(task.exception()))
                else:
                    pass
            tasks = _get_task_from_queue()
            if unfinished is not None:
                tasks += list(unfinished)

    def start(self):
        super().start()
        if self._task_process_thread is not None \
                and not self._task_process_thread.stopped() \
                and self._task_process_thread.is_alive():
            return
        self._task_process_thread = StoppableThread(target=self._process_task)
        self._task_process_thread.setDaemon(True)
        self._task_process_thread.start()


class PluginEventExecutorException(Exception):
    pass


class PluginEventExecutor(AsyncEventExecutor):
    """ A cec-based plugin event listener


    A cec-based plugin event executor monitor the plugin event from CEC,
    and perform the corresponding response actions while receive one plugin event.
    """

    def __init__(self, config: ConfigParser, channel_job_executor: ChannelJobExecutor):
        super().__init__(config.get_cec_url(
            target=CecTarget.PRODUCER), callback=self.process_event)
        self._config = config
        self._channel_job_executor = channel_job_executor
        self.node_manager = NodeManager(config, self._channel_job_executor)
        self.append_group_consume_task(
            config.get_server_config().cec.topics.SYSOM_CEC_PLUGIN_TOPIC,
            config.get_consumer_group(),
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )

    async def get_arch_from_remote_node(self, instance: str) -> str:
        result = await self._channel_job_executor.dispatch_job(
            channel_opt="cmd",
            params={
                "instance": instance,
                "command": f"uname -m",
            },
            timeout=self._config.get_node_config().get("timeout", 60000),
            auto_retry=True
        ).execute_async()
        if result.code != 0:
            raise PluginEventExecutorException(
                f"Get arch from remote node({instance}) failed: {result.err_msg}"
            )
        return result.result.strip()

    async def perform_init(self, instance: str, **args):
        arch = await self.get_arch_from_remote_node(instance)
        await self.node_manager.prepare_files_async(arch)
        await self.node_manager.perform_init_async(arch, instance)

    async def perform_clear(self, instance: str, **args):
        arch = await self.get_arch_from_remote_node(instance)
        await self.node_manager.perform_clear_async(arch, instance)

    async def perform_update(self, instance: str, **args):
        arch = await self.get_arch_from_remote_node(instance)
        await self.node_manager.perform_clear_async(arch, instance)

    async def _process_plugin_event(self, event: Event):
        """Process plugin event
        {
            "type": "clean",
            "params": {
                "channel": "ssh",
                "instance": instance.ip,
                "username": instance.username,
                "port": instance.port
                "token": user token
            },
            "echo": {
                "instance": instance.ip,
                "label": "host_init"
            }
        }
        """
        try:
            value = event.value
            if not isinstance(value, dict):
                raise PluginEventExecutorException(
                    f"Event value must be dict, not others: {value}"
                )
            plugin_event_type = value.get("type", "Unknown type")
            params = value.get("params", {})

            if plugin_event_type == "init":
                # perform monitor init
                await self.perform_init(params.pop("instance", ""), **params)
            elif plugin_event_type == "clean":
                # perform monitor clear
                await self.perform_clear(params.pop("instance", ""), **params)
            elif plugin_event_type == "update":
                await self.perform_update(params.pop("instance", ""), **params)
            else:
                raise Exception(f"Receive not supprt plugin event: {event}")
        except Exception as exc:
            logger.exception(
                f"Diagnosis process plugin event error: {str(exc)}")

    async def process_event(self, event: Event, task: CecAsyncConsumeTask):
        try:
            if task.topic_name == self._config.get_server_config().cec.topics.SYSOM_CEC_PLUGIN_TOPIC:
                await self._process_plugin_event(event)
            else:
                # Unexpected
                logger.error("Receive unknown topic event, unexpected!!")
        except Exception as exc:
            logger.exception(exc)
        finally:
            task.ack(event)
