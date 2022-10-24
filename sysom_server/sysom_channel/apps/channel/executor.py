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
from cec_base.producer import Producer
from cec_base.cec_client import CecClient
from cec_base.log import LoggerHelper
from django.conf import settings

logger = logging.getLogger(__name__)


class ChannelListener(CecClient):
    """ A cec-based channel listener

    A cec-based channel lilster, ssed to listen to requests for channels from 
    other modules and output the results to cec after performing the corresponding
    operation on the target node

    Args:
        task_process_thread_num(str): The number of threads contained in the thread 
                                       pool used to execute the task

    """

    def __init__(self, task_process_thread_num: int = 5) -> None:
        CecClient.__init__(self, settings.SYSOM_CEC_URL)
        self.append_group_consume_task(
            settings.SYSOM_CEC_CHANNEL_TOPIC,
            settings.SYSOM_CEC_CHANNEL_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self._target_topic = settings.SYSOM_CEC_CHANNEL_RESULT_TOPIC

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

    def _perform_opt(self, opt_func: Callable[[str, dict], dict],
                     default_channel: str, params: dict) -> dict:
        """
        Use the specified channel to perform operations on the remote 
        node and return the results.
        """
        result, err = {}, None
        try:
            result = opt_func(default_channel, params)
        except Exception as exc:
            logger.error(exc)
            err = exc
            channels_path = os.path.join(settings.BASE_DIR, 'lib', 'channels')
            packages = [dir.replace('.py', '') for dir in os.listdir(
                channels_path) if not dir.startswith('__')]
            packages.remove('base')
            packages.remove(default_channel)

            for _, pkg in enumerate(packages):
                try:
                    result = opt_func(pkg, params)
                    err = None
                    break
                except Exception as exc:
                    logger.error(exc)
                    err = exc
        if err is not None:
            raise err
        return result

    def _do_run_command(self, channel_type: str, params: dict) -> dict:
        """cmd opt"""
        return self._get_channel(channel_type)(**params).run_command()

    def _do_init_channel(self, channel_type: str, params: dict) -> dict:
        """init opt"""
        return self._get_channel(channel_type).initial(**params)

    def _process_each_task(self, consumer: Consumer, event: Event):
        """
        处理每个单独的任务
        """
        task = event.value
        result = {
            "code": 0,
            "err_msg": "",
            "echo": task.get("echo", {}),
            "result": {}
        }
        try:
            opt_type = task.get("type", "cmd")
            channel_type = task.get("channel", "ssh")
            params = task.get("params", {})

            if opt_type not in self._opt_table:
                result["code"] = 1
                result["err_msg"] = f"Not support opt: {opt_type}"
            else:
                code, raw_result = self._perform_opt(
                    self._opt_table[opt_type],
                    channel_type,
                    params
                )
                result["code"] = code
                if code != 0:
                    result["err_msg"] = raw_result
                else:
                    result["result"] = raw_result
        except Exception as e:
            LoggerHelper.get_lazy_logger().error(e)
            LoggerHelper.get_lazy_logger().exception(e)
            result["code"] = 1
            result["err_msg"] = str(e)
        finally:
            # 执行消息确认
            res = consumer.ack(event)
            # 将任务执行的结果写入到事件中心，供 Task 模块获取
            self.delivery(self._target_topic, result)

    def on_receive_event(self, consumer: Consumer, producer: Producer, event: Event, task: dict):
        self._task_process_thread_poll.submit(
            self._process_each_task, consumer, event)
