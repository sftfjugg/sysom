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
from loguru import logger
from queue import Queue
from .consume_status_storage import ConsumeStatusStorage
from .common import StaticConst, ClientBase


class RedisConsumer(Consumer, ClientBase):
    """A redis-based execution module implement of Consumer

    一个基于 Redis 实现的执行模块中的 Consumer 实现

    """

    def __init__(self, url: CecUrl, topic_name: str, consumer_id: str = "",
                 group_id: str = "", start_from_now: bool = True,
                 default_batch_consume_limit: int = 10):
        Consumer.__init__(self, topic_name, consumer_id, group_id,
                          start_from_now, default_batch_consume_limit)
        ClientBase.__init__(self, url)

        # 特化参数1：pending_expire_time => pending 消息超时时间
        #   - 在pending列表中超过指定时间的消息，当前消费者会尝试将其获取下来消费
        self.pending_expire_time = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME
        )

        self._current_url = ""
        self._redis_client: Redis = None
        self.connect_by_cec_url(url)
        self._last_event_id: str = None  # 最近一次消费的ID
        self._message_cache_queue = Queue()  # 消息缓存队列
        self.consume_status_storage = None
        self.inner_topic_name = StaticConst.get_inner_topic_name(
            topic_name)

        # 如果是组消费模式，检查消费组是否存在
        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            # 尝试创建消费组，如果已经存在就忽略，如果不存在则创建
            RedisAdmin.static_create_consumer_group(self._redis_client,
                                                    group_id,
                                                    True)
            self.consume_status_storage = ConsumeStatusStorage(
                self._redis_client,
                topic_name,
                group_id
            )

        # 通过本字段标识是否是需要拉取 pending 列表中的消息
        self._is_need_fetch_pending_message = True

    @logger.catch(reraise=True)
    def consume(self, timeout: int = -1, auto_ack: bool = False,
                batch_consume_limit: int = 0) -> [Event]:
        """Consume some event from cec

        从事件中心尝试消费一组事件

        Args:
            timeout(int): 超时等待时间（单位：ms），<=0 表示阻塞等待
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
        if timeout <= 0:
            timeout = 0
        batch_consume_limit = self.default_batch_consume_limit if \
            batch_consume_limit <= 0 else batch_consume_limit

        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to consume one message from "
            f"{self.topic_name} in {self.consume_mode}.")

        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            message_ret = [[[], [], []]]
            if self._last_event_id is None:
                # 确保消费组存在
                RedisAdmin.add_group_to_stream(
                    self._redis_client, self.topic_name, self.group_id)

            # 首先处理 pending list transfer
            # 1. 尝试从消费组整体的 pending list 中过滤出长时间未 ACK 的事件，即在
            #    pending list 中停留时间超过 'pending_expire_time' 的事件；
            # 2. 并将超期的事件 transfer 到当前消费者进行处理
            if self.is_gte_6_2(self._redis_client):
                # Redis 版本大于等于 6.2 支持使用 xautoclaim 来合并 xpending + xclaim 操
                # 作，因此直接使用 xautoclaim 即可
                # 尝试从消费组全局的 pending list transfer 超期的消息到当前消费者
                message_ret = [
                    self._redis_client.xautoclaim(
                        self.inner_topic_name, self.group_id,
                        self.consumer_id,
                        min_idle_time=self.pending_expire_time,
                        count=batch_consume_limit
                    )
                ]
            else:
                # 如果Redis版本小于 6.2，则不支持 xautoclaim，需要使用 xpending + xclaim
                # 尝试从消费组全局的 pending list transfer 超期的消息到当前消费者
                pending_list = self._redis_client.xpending_range(
                    self.inner_topic_name, self.group_id,
                    min='-',
                    max='+' if self._last_event_id is None else self._last_event_id,
                    count=batch_consume_limit,
                )
                if len(pending_list) > 0:
                    pending_list = list(filter(
                        lambda item: item.get('time_since_delivered',
                                              0) > self.pending_expire_time,
                        pending_list
                    ))
                    pending_ids = list(map(
                        lambda item: item.get('message_id', '0-0'),
                        pending_list
                    ))
                    if len(pending_ids) > 0:
                        message_ret = [[[], self._redis_client.xclaim(
                            self.inner_topic_name, self.group_id,
                            self.consumer_id, self.pending_expire_time,
                            pending_ids
                        )]]

            if len(message_ret[0][1]) <= 0:
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
                            self.inner_topic_name: '0-0'
                        }, count=batch_consume_limit, block=timeout,
                        noack=auto_ack
                    )
                    if len(message_ret[0][1]) == 0:
                        self._is_need_fetch_pending_message = False
                        message_ret = self._redis_client.xreadgroup(
                            self.group_id, self.consumer_id, {
                                self.inner_topic_name: '>'
                            }, count=batch_consume_limit, block=timeout,
                            noack=auto_ack
                        )
                else:
                    # 组消费模式单独处理
                    message_ret = self._redis_client.xreadgroup(
                        self.group_id, self.consumer_id, {
                            self.inner_topic_name: '>'
                        }, count=batch_consume_limit, block=timeout,
                        noack=auto_ack
                    )

            # 更新状态，执行必要的清除任务
            self.consume_status_storage.update()
        else:
            # 下面处理扇形广播消费
            if self._last_event_id is None:
                # 表示自从这个 Consumer 被实例化后第一次调用消费方法，做一些初始化操作
                message_ret = self._redis_client.xread({
                    self.inner_topic_name: '$' if self.consume_mode ==
                                                  ConsumeMode.CONSUME_FROM_NOW else '0-0'
                }, count=batch_consume_limit, block=timeout)
            else:
                # 按序依次取出消息
                message_ret = self._redis_client.xread({
                    self.inner_topic_name: self._last_event_id
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
            if StaticConst.REDIS_CEC_EVENT_VALUE_KEY not in message_tuple[1]:
                continue

            message_content = json.loads(
                message_tuple[1][StaticConst.REDIS_CEC_EVENT_VALUE_KEY])
            msg = Event(message_content, message_tuple[0])
            messages.append(msg)
            LoggerHelper.get_lazy_logger().debug(
                f"{self} read one message from {self.topic_name} success "
                f"=> {msg}")
        return messages

    @logger.catch(reraise=True)
    def ack(self, event: Event) -> int:
        """Confirm that the specified event has been successfully consumed

        事件确认，在接收到事件并成功处理后调用本方法确认

        Args:
            event(Event): 要确认的事件
                1. 必须是通过 Consumer 消费获得的 Event 实例；
                2. 自行构造的 Event 传递进去不保证结果符合预期

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
            >>> consumer.ack(msg)
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to ack => {event.event_id}"
        )
        # 使用流水线来加速
        # 1. 记录当前主题-消费组最新确认的ID
        pl = self._redis_client.pipeline()
        key = RedisAdmin.get_topic_consumer_group_meta_info_key(
            self.topic_name,
            self.group_id,
            StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID)
        pl.set(
            key,
            event.event_id
        )
        # 2. 对事件进行确认
        pl.xack(self.inner_topic_name, self.group_id, event.event_id)

        # 3. 记录确认的ID
        self.consume_status_storage.do_after_ack_by_pl(pl, event)
        rets = pl.execute()
        LoggerHelper.get_lazy_logger().info(
            f"{self} ack '{event.event_id}' successfully"
        )
        return rets[1]

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
