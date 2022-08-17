# -*- coding: utf-8 -*- #
"""
Time                2022/7/26 16:45
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_consumer.py
Description:
"""
import json

from ..cec_base.consumer import Consumer, ConsumeMode
from ..cec_base.event import Event
from ..cec_base.url import CecUrl
from ..cec_base.log import LoggerHelper
from redis import Redis
from .utils import do_connect_by_cec_url
from .redis_admin import RedisAdmin
from .redis_producer import RedisProducer
from loguru import logger
from queue import Queue


class RedisConsumer(Consumer):
    """A redis-based execution module implement of Consumer

    一个基于 Redis 实现的执行模块中的 Consumer 实现

    """

    def __init__(self, url: CecUrl, topic_name: str, consumer_id: str = "",
                 group_id: str = "", start_from_now: bool = True,
                 default_batch_consume_limit: int = 10):
        super().__init__(topic_name, consumer_id, group_id, start_from_now,
                         default_batch_consume_limit)
        self._current_url = ""
        self._redis_client: Redis = None
        self.connect_by_cec_url(url)
        self._last_event_id: str = None  # 最近一次消费的ID
        self._message_cache_queue = Queue()  # 消息缓存队列

        # 如果是组消费模式，检查消费组是否存在
        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            # 尝试创建消费组，如果已经存在就忽略，如果不存在则创建
            RedisAdmin.static_create_consumer_group(self._redis_client,
                                                    group_id,
                                                    True)

        # 通过本字段标识是否是需要拉取 pending 列表中的消息
        self._is_need_fetch_pending_message = True

    @logger.catch(reraise=True)
    def consume(self, timeout: int = 0, auto_ack: bool = False,
                batch_consume_limit: int = 0) -> [Event]:
        """Consume some event from cec

        从事件中心尝试消费一组事件

        Args:
            timeout(int): 超时等待时间（单位：ms），0 表示阻塞等待
            auto_ack(bool): 是否开启自动确认（组消费模式有效）

                1. 一旦开启自动确认，每成功读取到一个事件消息就会自动确认；
                2. 调用者一定要保证消息接收后正常处理，因为一旦某个消息被确认，消息中心不保证下次
                   仍然可以获取到该消息，如果客户端在处理消息的过程中奔溃，则该消息或许无法恢复；
                3. 所以最保险的做法是，auto_ack = False 不开启自动确认，在事件被正确处理完
                   后显示调用 Consumer.ack() 方法确认消息被成功处理;
                4. 如果有一些使用组消费业务，可以承担事件丢失无法恢（只会在客户端程序奔溃没有正确
                   处理的情况下才会发生）的风险，则可以开启 auto_ack 选项。

            batch_consume_limit(int): 批量消费限制

                1. 该参数指定了调用 consume 方法，最多一次拉取的事件的数量；
                2. 如果该值 <= 0 则将采用 self.default_batch_consume_limit 中指定的缺省
                   值；
                3. 如果该值 > 0 则将覆盖 self.default_batch_consume_limit，以本值为准。

        Returns:
            [Message]: The Event list

        Examples:
            >>> consumer = dispatch_consumer(
            ... "redis://localhost:6379?password=123456"
            ... , 'this_is_a_test_topic'
            ... , consumer_id=Consumer.generate_consumer_id()
            ... , start_from_now=False)
            >>> consumer.consume(200, auto_ack=False, batch_consume_limit=20)
        """
        batch_consume_limit = self.default_batch_consume_limit if \
            batch_consume_limit <= 0 else batch_consume_limit

        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to consume one message from "
            f"{self.topic_name} in {self.consume_mode}.")
        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            if self._last_event_id is None:
                # 确保消费组存在
                RedisAdmin.add_group_to_stream(
                    self._redis_client, self.topic_name, self.group_id)

            # 判断是否需要从 pending list 拉取消息
            # 1. 实例创建后，第一次消费会尝试获取 pending 列表的消息，即当前消费者（由
            #    consumer_id 区分不同的消费者，使用相同的 consumer_id 创建的RedisConsumer
            #    实例表征的是相同的消费者）从事件中心拉取了，但是没确认的消息列表；
            # 2. 考虑到没确认的消息列表可能较多，一次拉取不完，所以如果成功从 pending
            #    list 拉到消息则 _is_need_fetch_pending_message 保持不变，下次仍然尝
            #    试从 pending list 继续拉取消息；
            # 3. 如果从 pending list 没有拉取到消息，则将 _is_need_fetch_pending_message
            #    设置为 False，本 RedisConsumer 之后将不会尝试从 pending list 拉取消息
            if self._is_need_fetch_pending_message:
                message_ret = self._redis_client.xreadgroup(
                    self.group_id, self.consumer_id, {
                        self.topic_name: '0-0'
                    }, count=batch_consume_limit, block=timeout
                )
                if len(message_ret[0][1]) == 0:
                    self._is_need_fetch_pending_message = False
                    message_ret = self._redis_client.xreadgroup(
                        self.group_id, self.consumer_id, {
                            self.topic_name: '>'
                        }, count=batch_consume_limit, block=timeout)
            else:
                # 组消费模式单独处理
                message_ret = self._redis_client.xreadgroup(
                    self.group_id, self.consumer_id, {
                        self.topic_name: '>'
                    }, count=batch_consume_limit, block=timeout)
        else:
            # 下面处理扇形广播消费
            if self._last_event_id is None:
                # 表示自从这个 Consumer 被实例化后第一次调用消费方法，做一些初始化操作
                message_ret = self._redis_client.xread({
                    self.topic_name: '$' if self.consume_mode ==
                                            ConsumeMode.CONSUME_FROM_NOW else '0-0'
                }, count=batch_consume_limit, block=timeout)
            else:
                # 按序依次取出消息
                message_ret = self._redis_client.xread({
                    self.topic_name: self._last_event_id
                }, count=batch_consume_limit, block=timeout)
        if len(message_ret) < 1 or len(message_ret[0]) < 2 or len(
                message_ret[0][1]) < 1:
            LoggerHelper.get_lazy_logger().warning(
                f"{self} read some message from "
                f"{self.topic_name}, but its invalid. => "
                f"{message_ret}")
            return []
        messages: [Event] = []
        for message_tuple in message_ret[0][1]:
            self._last_event_id = message_tuple[0]

            # 过滤掉不是通过 cec 接口投递的事件
            if RedisProducer.REDIS_CEC_EVENT_VALUE_KEY not in message_tuple[1]:
                continue

            message_content = json.loads(
                message_tuple[1][RedisProducer.REDIS_CEC_EVENT_VALUE_KEY])
            msg = Event(message_content, message_tuple[0])
            messages.append(msg)
            LoggerHelper.get_lazy_logger().debug(
                f"{self} read one message from {self.topic_name} success "
                f"=> {msg}")
            if auto_ack:
                self._redis_client.xack(self.topic_name, self.group_id,
                                        self._last_event_id)
                LoggerHelper.get_lazy_logger().debug(
                    f"{self} auto_ack => <id={msg.event_id}, topic_name="
                    f"{self.topic_name}, consumer_group_id={self.group_id}>")

            LoggerHelper.get_lazy_logger().info(
                f"{self} consume one message from {self.topic_name} "
                f"success => {msg}")
        return messages

    @logger.catch(reraise=True)
    def ack(self, event_id: str) -> int:
        """Confirm that the specified event has been successfully consumed

        事件确认，在接收到事件并成功处理后调用本方法确认

        Args:
            event_id: 事件ID

        Returns:
            int: 1 if successfully, 0 otherwise

        Examples:
            >>> consumer = dispatch_consumer(
            ... "redis://localhost:6379?password=123456"
            ... , 'this_is_a_test_topic'
            ... , consumer_id=Consumer.generate_consumer_id()
            ... , start_from_now=False)
            >>> msgs = consumer.consume(200, auto_ack=False, batch_consume_limit=1)
            >>> msg = msgs[0]
            >>> consumer.ack(msg.event_id)
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to ack => {event_id}"
        )
        ret = self._redis_client.xack(self.topic_name, self.group_id, event_id)
        LoggerHelper.get_lazy_logger().info(
            f"{self} ack '{event_id}' successfully"
        )
        return ret

    @logger.catch(reraise=True)
    def __getitem__(self, item):
        msg = None
        if not self._message_cache_queue.empty():
            msg = self._message_cache_queue.get()
        else:
            for new_msg in self.consume():
                self._message_cache_queue.put(new_msg)
            if not self._message_cache_queue.empty():
                msg = self._message_cache_queue.get()
        return msg

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
