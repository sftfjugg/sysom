# -*- coding: utf-8 -*- #
"""
Time                2022/10/11 16:13
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                executor.py
Description:
"""
from concurrent.futures import ThreadPoolExecutor
from importlib import import_module
from sdk.cec_base.event import Event
from sdk.cec_base.consumer import Consumer
from sdk.cec_base.cec_client import CecClient
from sdk.cec_base.log import LoggerHelper


class TaskExecutor(CecClient):
    """ A cec-based task executor

    一个基于事件中心实现的任务执行器

    Args:
        url(str): 用于连接事件中心的地址
        task_delivery_topic(str): 用于获取任务的主题
        consumer_id(str): 用于消费任务的消费者ID
        group_id(str): 用于消费任务的消费者组ID
        task_result_topic(str): 用于投递任务处理结果的主题
        task_process_thread_num(str): 用于执行任务的线程池中包含的线程的数量
    """

    def __init__(self, url: str, task_delivery_topic: str, consumer_id: str, group_id: str,
                 task_result_topic: str,
                 task_process_thread_num: int = 5) -> None:
        CecClient.__init__(self, url)
        self.append_group_consume_task(
            task_delivery_topic, group_id, consumer_id, ensure_topic_exist=True
        )
        self._target_topic = task_result_topic

        # 执行任务的线程池数量
        self._task_process_thread_poll = ThreadPoolExecutor(
            max_workers=task_process_thread_num)

    def _get_channel(self, data: dict):
        """
        根据要执行的命令，动态引入一个 Channel 的实现用于执行命令
        """
        channel_type = data.pop('channel', 'ssh')
        try:
            package = import_module(f'lib.channels.{channel_type}')
            return package.Channel(**data, channel_name=channel_type)
        except Exception as e:
            raise Exception(message='No channels available!')

    def _process_each_task(self, consumer: Consumer, event: Event):
        """
        处理每个单独的任务
        """
        try:
            task = event.value
            command_list = task.get('command', [])
            task_id = task.get("task_id", "")
            result = {
                "status": 0,
                "task_id": task_id,
                "errMsg": "",
                "results": []
            }
            for script in command_list:
                # 检查参数
                ip = script.get("instance", None)
                cmd = script.get("cmd", None)
                if not ip or not cmd:
                    result["status"] = 1
                    result["errMsg"] = "script result find not instance or cmd"
                    break

                # 根据参数动态引入 Channel 包，构造一个 Channel 实例用于执行命令
                channel = self._get_channel(script)

                # 使用对应的 Channel 执行命令，并得到结果
                # 取出任务执行的结果：{'state': 0, 'result': 'xxxxxxxx'} 0为执行成功, 1位=为执行失败
                channel_result = channel.run_command()
                status = channel_result.get("state", 1)
                res = channel_result.get("result", {}).get("result")
                # 如果本轮的命令执行出错，则直接停止执行任务，返回错误信息
                if status != 0:
                    if not res:
                        res = f"Sysak doesn't return any error msg, state = {status}"
                    result["status"] = 1
                    result["errMsg"] = res
                    break

                # 如果命令执行成功，则将执行的结果保存
                result["results"].append(res)
        except Exception as e:
            LoggerHelper.get_lazy_logger().exception(e)
            result["state"] = 1
            result["errMsg"] = str(e)
        # 执行消息确认
        res = consumer.ack(event)
        # 将任务执行的结果写入到事件中心，供 Task 模块获取
        self.delivery(self._target_topic, result)

    def on_receive_event(self, consumer: Consumer, event: Event, task: dict):
        self._task_process_thread_poll.submit(
            self._process_each_task, consumer, event)
