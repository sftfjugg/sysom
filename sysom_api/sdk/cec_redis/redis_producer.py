# -*- coding: utf-8 -*- #
"""
Time                2022/7/26 18:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_producer.py
Description:
"""
import json
from typing import Callable

from ..cec_base.producer import Producer
from ..cec_base.event import Event
from ..cec_base.url import CecUrl
from ..cec_base.admin import TopicNotExistsException
from ..cec_base.log import LoggerHelper
from redis import Redis
from .utils import do_connect_by_cec_url
from .redis_admin import RedisAdmin
from loguru import logger
from .common import StaticConst, ClientBase


class RedisProducer(Producer, ClientBase):
    """A redis-based execution module implement of Producer

    一个基于 Redis 实现的执行模块中的 Producer 实现

    """

    def __init__(self, url: CecUrl):
        Producer.__init__(self)
        ClientBase.__init__(self, url)
        self._current_url = ""

        # 处理 Redis 实现的事件中心的特化参数
        self.default_max_len = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN
        )
        self.auto_mk_topic = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC
        )

        # 1. 首先连接到 Redis 服务器
        self._redis_client: Redis = None
        self.connect_by_cec_url(url)

        # 2. 新建一个 dict，用于保存 topic_name => TopicMeta 的映射关系
        self._topic_metas = {

        }

    @logger.catch(reraise=True)
    def produce(self, topic_name: str, message_value: dict,
                callback: Callable[[Exception, Event], None] = None,
                partition: int = -1,
                **kwargs):
        """Generate one new event, then put it to event center

        发布一个事件到事件中心 => 对应到 Redis 就是生产一个消息注入到 Stream 当中

        Args:
            topic_name: 主题名称
            message_value: 事件内容
            callback(Callable[[Exception, Event], None]): 事件成功投递到事件中心回调
            partition(int): 分区号
                1. 如果指定了有效分区号，消息投递给指定的分区（不建议）；
                2. 传递了一个正数分区号，但是无此分区，将抛出异常；
                3. 传递了一个负数分区号（比如-1），则消息将使用内建的策略均衡的投
                   递给所有的分区（建议）。

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to produce one message {message_value} to "
            f"{topic_name}.")

        topic_exist = False
        inner_topic_name = StaticConst.get_inner_topic_name(topic_name)
        # 判断是否有目标主题的元数据信息
        if inner_topic_name not in self._topic_metas or \
                self._topic_metas[inner_topic_name] is None:
            # 拉取元数据信息
            self._topic_metas[inner_topic_name] = RedisAdmin.get_meta_info(
                self._redis_client, topic_name)

            # 如果元数据信息无效，说明主题不存在
            if self._topic_metas[inner_topic_name] is None:
                if self.auto_mk_topic:
                    # 如果设置了主题不存在时自动创建，则尝试创建主题
                    topic_exist = RedisAdmin.static_create_topic(
                        self._redis_client,
                        topic_name)
                    LoggerHelper.get_lazy_logger().debug(
                        f"{self} try to auto create topic: {topic_exist}"
                    )
            else:
                topic_exist = True
        else:
            topic_exist = True

        e, event_id = None, None
        if not topic_exist:
            LoggerHelper.get_lazy_logger().error(
                f"{self} Topic ({topic_name}) not exists.")
            # Topic 不存在
            e = TopicNotExistsException(
                f"Topic ({topic_name}) not exists.")
        else:
            # 将消息放到对应的 topic 中
            if 'maxlen' not in kwargs:
                kwargs['maxlen'] = self.default_max_len
            event_id = self._redis_client.xadd(inner_topic_name, {
                StaticConst.REDIS_CEC_EVENT_VALUE_KEY: json.dumps(
                    message_value)
            }, **kwargs)

            # 主题不存在则额外处理
            if event_id is None:
                e = TopicNotExistsException(
                    f"Topic ({topic_name}) not exists.")
            else:
                LoggerHelper.get_lazy_logger().info(
                    f"{self} produce one message '{event_id}'=>{message_value} "
                    f"successfully."
                )

        if callback is not None:
            callback(e, Event(message_value, event_id))

    @logger.catch(reraise=True)
    def flush(self, timeout: int = -1):
        """Flush all cached event to event center

        TODO: 目前 RedisProducer 的produce实现为阻塞，所以 flush 实现可以为空

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
            >>> producer.flush()
        """
        pass

    @logger.catch(reraise=True)
    def connect_by_cec_url(self, url: CecUrl):
        """Connect to redis server by CecUrl

        通过 CecUrl 连接到 Redis 服务器

        Args:
          url(str): CecUrl
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to connect to '{url}'.")
        self._redis_client = do_connect_by_cec_url(url)
        self._current_url = url.__str__()
        LoggerHelper.get_lazy_logger().success(
            f"{self} connect to '{url}' successfully.")
        return self

    @logger.catch(reraise=True)
    def connect(self, url: str):
        """Connect to redis server by url

        连接到远端的消息中间件 => 对应到本模块就是连接到 Redis 服务器

        Args:
          url(str): CecUrl
        """
        cec_url = CecUrl.parse(url)
        return self.connect_by_cec_url(cec_url)

    @logger.catch()
    def __del__(self):
        self.disconnect()

    @logger.catch(reraise=True)
    def disconnect(self):
        """Disconnect from redis server

        断开连接 => 对应到本模块就是断开 Redis 服务器连接
        """
        if self._redis_client is None:
            return
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to disconnect from '{self._current_url}'.")
        self._redis_client.quit()
        self._redis_client = None
        LoggerHelper.get_lazy_logger().success(
            f"{self} disconnect from '{self._current_url}' successfully.")
