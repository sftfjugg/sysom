# -*- coding: utf-8 -*- #
"""
Time                2022/10/11 16:13
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                executor.py
Description:
"""
import logging
from concurrent.futures import ThreadPoolExecutor
from importlib import import_module
import os
from typing import Callable
from cec_base.event import Event
from cec_base.consumer import Consumer
from cec_base.producer import Producer, dispatch_producer
from cec_base.cec_client import MultiConsumer, CecAsyncConsumeTask
from cec_base.log import LoggerHelper
from conf.settings import *
from lib.channels.base import ChannelResult
import asyncssh

logger = logging.getLogger(__name__)


CHANNEL_PARAMS_TIMEOUT = "__channel_params_timeout"
CHANNEL_PARAMS_AUTO_RETRY = "__channel_params_auto_retry"
CHANNEL_PARAMS_RETURN_AS_STREAM = "__channel_params_return_as_stream"

class ChannelListener(MultiConsumer):
    """ A cec-based channel listener

    A cec-based channel lilster, ssed to listen to requests for channels from 
    other modules and output the results to cec after performing the corresponding
    operation on the target node

    Args:
        task_process_thread_num(str): The number of threads contained in the thread 
                                       pool used to execute the task

    """

    def __init__(self, task_process_thread_num: int = 5) -> None:
        super().__init__(SYSOM_CEC_URL, custom_callback=self.on_receive_event)
        self.append_group_consume_task(
            SYSOM_CEC_CHANNEL_TOPIC,
            SYSOM_CEC_CHANNEL_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self._target_topic = SYSOM_CEC_CHANNEL_RESULT_TOPIC
        self._producer: Producer = dispatch_producer(SYSOM_CEC_URL)

        # Define opt table
        self._opt_table = {
            'init': self._do_init_channel,
            "cmd": self._do_run_command
        }

        # 执行任务的线程池数量
        self._task_process_thread_poll = ThreadPoolExecutor(
            max_workers=task_process_thread_num)

    def _get_channel(self, channel_type):
        """
        根据要执行的命令，动态引入一个 Channel 的实现用于执行命令
        """
        try:
            return import_module(f'lib.channels.{channel_type}').Channel
        except Exception as e:
            raise Exception(f'No channels available => {str(e)}')

    def _delivery(self, topic: str, value: dict):
        self._producer.produce(topic, value)
        self._producer.flush()

    def _perform_opt(self, opt_func: Callable[[str, dict], dict],
                     default_channel: str, task: dict) -> ChannelResult:
        """
        Use the specified channel to perform operations on the remote 
        node and return the results.
        """
        result, err = {}, None
        try:
            result = opt_func(default_channel, task)
        except Exception as exc:
            logger.error(exc)
            err = exc
            channels_path = os.path.join(BASE_DIR, 'lib', 'channels')
            packages = [dir.replace('.py', '') for dir in os.listdir(
                channels_path) if not dir.startswith('__')]
            packages.remove('base')
            packages.remove(default_channel)

            for _, pkg in enumerate(packages):
                try:
                    result = opt_func(pkg, task)
                    err = None
                    break
                except Exception as exc:
                    logger.error(exc)
                    err = exc
        if err is not None:
            raise err
        return result

    def _do_run_command(self, channel_type: str, task: dict) -> ChannelResult:
        """cmd opt"""
        def on_data_received(data: str, data_type: asyncssh.DataType):
            echo = task.get("echo", {})
            bind_result_topic = task.get("bind_result_topic", None)
            if bind_result_topic is not None:
                self._delivery(bind_result_topic, {
                    "code": 100,
                    "err_msg": "",
                    "echo": echo,
                    "result": data
                })
                self._producer.flush()
        params = task.get("params", {})
        timeout = params.pop(CHANNEL_PARAMS_TIMEOUT, None)
        auto_retry = params.pop(CHANNEL_PARAMS_AUTO_RETRY, False)
        return_as_stream = params.pop(CHANNEL_PARAMS_RETURN_AS_STREAM, False)
        res = self._get_channel(channel_type)(**params).run_command_auto_retry(
            timeout=timeout,
            auto_retry=auto_retry,
            on_data_received=on_data_received if return_as_stream else None
        )
        return res

    def _do_init_channel(self, channel_type: str, task: dict) -> ChannelResult:
        """init opt"""
        params = task.get("params", {})
        timeout = params.pop(CHANNEL_PARAMS_TIMEOUT, None)
        auto_retry = params.pop(CHANNEL_PARAMS_AUTO_RETRY, False)
        return self._get_channel(channel_type).initial(
            **params, timeout=timeout, auto_retry=auto_retry
        )

    def _process_each_task(self, event: Event, cecConsumeTask: CecAsyncConsumeTask):
        """
        处理每个单独的任务
        """
        task = event.value
        result = {
            "code": 0,
            "err_msg": "",
            "echo": task.get("echo", {}),
            "result": ""
        }
        bind_result_topic = task.get("bind_result_topic", None)
        try:
            opt_type = task.get("type", "cmd")
            channel_type = task.get("channel", "ssh")
            params = task.get("params", {})

            if opt_type not in self._opt_table:
                result["code"] = 1
                result["err_msg"] = f"Not support opt: {opt_type}"
            else:
                channel_result = self._perform_opt(
                    self._opt_table[opt_type],
                    channel_type,
                    task=task
                )
                result["code"] = channel_result.code
                if channel_result.code != 0:
                    result["err_msg"] = channel_result.err_msg
                    if channel_result.err_msg == "" and channel_result.result != "":
                        result["err_msg"] = channel_result.result
                else:
                    result["result"] = channel_result.result
        except Exception as e:
            LoggerHelper.get_lazy_logger().error(e)
            LoggerHelper.get_lazy_logger().exception(e)
            result["code"] = 1
            result["err_msg"] = str(e)
        finally:
            # 执行消息确认
            res = cecConsumeTask.ack(event)
            # 将任务执行的结果写入到事件中心，供 Task 模块获取
            self._delivery(self._target_topic, result)
            # 如果显示指定了反馈topic，则往该topic也发送一份
            if (bind_result_topic):
                self._delivery(bind_result_topic, result)

    def on_receive_event(self, event: Event, task: CecAsyncConsumeTask):
        self._task_process_thread_poll.submit(
            self._process_each_task, event, task)
