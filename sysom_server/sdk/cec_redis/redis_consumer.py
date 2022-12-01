# -*- coding: utf-8 -*- #
"""
Time                2022/8/15 16:45
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_consumer.py
Description:
"""
import json
from queue import Queue
from typing import List, Optional

import redis.exceptions
from redis import Redis
from loguru import logger
from cec_base.consumer import Consumer, ConsumeMode
from cec_base.event import Event
from cec_base.url import CecUrl
from cec_base.log import LoggerHelper
from .utils import do_connect_by_cec_url
from .redis_admin import RedisAdmin
from .consume_status_storage import ConsumeStatusStorage
from .common import StaticConst, ClientBase
from .admin_static import static_create_consumer_group, \
    get_topic_consumer_group_meta_info_key
from .heartbeat import Heartbeat
from .utils import RedisLocker, transfer_pending_list


class RedisConsumer(Consumer, ClientBase):
    """A redis-based execution module implement of Consumer

    Consumer implementation in an execution module based on the Redis.

    """

    # pylint: disable=too-many-instance-attributes
    # Eight is reasonable in this case.
    def __init__(self, url: CecUrl, **kwargs):
        Consumer.__init__(self, **kwargs)
        ClientBase.__init__(self, url)

        # Specialized parameter 1: cec_auto_transfer_interval
        self._enable_pending_list_transfer = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_ENABLE_PENDING_LIST_TRANSFER
        )
        # Specialized parameter 2: cec_pending_expire_time
        self._pending_expire_time = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME
        )

        # Specialized parameter 3: cec_enable_heartbeat
        self._enable_heartbeat = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_ENABLE_HEART_BEAT
        )

        # Specialized parameter 4: cec_heartbeat_interval
        self._heartbeat_interval = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_HEARTBEAT_INTERVAL
        )

        self._current_url = ""
        self._redis_client: Optional[Redis] = None
        self._heartbeat: Optional[Heartbeat] = None
        self._last_event_id: Optional[str] = None  # Last consume ID
        self._event_cache_queue = Queue()  # Event cache queue
        self.consume_status_storage = None
        self.inner_topic_name = StaticConst.get_inner_topic_name(
            self.topic_name)

        # Identifies by this field whether it is a message that needs to be
        # pulled from the pending list
        self._is_need_fetch_pending_message = True
        self.connect_by_cec_url(url)

    def _pending_list_transfer(self, batch_consume_limit: int):
        """Do pending list transfer

        Check if there are any messages in the pending list of the same
        group that have not been acknowledged for a long time, and if so,
        try to transfer them to the current consumer for processing

        Returns:

        """
        _message_ret = [[[], [], []]]
        # First process pending list transfers
        # 1. Try to filter out events that have not been acked for a long
        #    time from the pending list of the consumer group as a whole,
        #    i.e. events that have been in the pending list for longer
        #    than 'pending_expire_time';
        # 2. Then transfer the overdue events to the current consumer for
        #    processing.
        if self.is_gte_6_2(self._redis_client):
            # Redis versions greater than or equal to 6.2 support the use
            # of 'xautoclaim' to merge 'xpending + xclaim' operations, so
            # it is straightforward to use 'xautoclaim' to attempt to
            # transfer overdue messages from the global pending list of the
            # consumer group to the current consumer
            _message_ret = [
                self._redis_client.xautoclaim(
                    self.inner_topic_name, self.group_id,
                    self.consumer_id,
                    min_idle_time=self._pending_expire_time,
                    count=batch_consume_limit,
                )
            ]
        else:
            # If Redis version is less than 6.2, 'xautoclaim' is not
            # supported, so you need to use 'xpending + xclaim ' to try to
            # transfer the overdue message from the pending list of the
            # consumer group global to the current consumer
            max_range = '+' if self._last_event_id is None else \
                self._last_event_id
            _message_ret = transfer_pending_list(
                self._redis_client, self.inner_topic_name, self.group_id,
                batch_consume_limit, self.consumer_id,
                min_id="-", max_id=max_range,
                min_idle_time=self._pending_expire_time
            )
        return _message_ret

    def _heartbeat_checkout(self, batch_consume_limit: int):
        """Offline consumer detect

        Check if there is an offline consumer in the group and if so try to
        transfer its unprocessed events to the current consumer
        """
        _message_ret, transfer_count = [[[], [], []]], 0
        if not self._enable_heartbeat or self._heartbeat is None:
            return _message_ret
        next_consumer = self._heartbeat.get_next_offline_consumer()
        while next_consumer is not None:
            with RedisLocker(
                    self._redis_client,
                    f"{StaticConst.REDIS_HEARTBEAT_LOCKER_PREFIX}"
                    f"{self.group_id}",
            ) as result:
                if not result:
                    continue
                _message_ret = transfer_pending_list(
                    self._redis_client, self.inner_topic_name,
                    self.group_id,
                    batch_consume_limit, self.consumer_id,
                    min_id="-", max_id="+",
                    min_idle_time=0, filter_consumer=next_consumer
                )
                transfer_count = len(_message_ret[0][1])
                if transfer_count < batch_consume_limit:
                    self._heartbeat.remove_consumer(next_consumer)
                if transfer_count > 0:
                    break
            next_consumer = self._heartbeat.get_next_offline_consumer()
        return _message_ret

    @logger.catch(reraise=True)
    def consume(self, timeout: int = -1, auto_ack: bool = False,
                batch_consume_limit: int = 0, **kwargs) -> List[Event]:
        """Consuming events from the Event Center

        Start to consume the event from event center according to the
        corresponding ConsumeMode

        Args:
            timeout(int): Blocking wait time
                          (Negative numbers represent infinite blocking wait)
            auto_ack(bool): Whether to enable automatic confirmation
                            (valid for group consumption mode)

                1. Once automatic acknowledgement is turned on, every event
                   successfully read will be automatically acknowledged;
                2. Caller must ensure that the event is processed properly
                   after it is received, because once a event is acknowledged,
                   the event center does not guarantee that the event will
                   still be available next time, and if the client runs down
                   while processing the message, the message may not be
                   recoverable;
                3. So it is safest to leave auto_ack = False and explicitly
                   call the Consumer.ack() method to acknowledge the event
                   after it has been processed correctly;

            batch_consume_limit(int): Batch consume limit

                1. This parameter specifies the number of events to be pulled
                   at most once by calling the consume method;
                2. If the value <= 0 then the default value specified in
                   self.default_batch_consume_limit will be used；
                3. If this value > 0 then it will override
                   self.default_batch_consume_limit, use current passed value.

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

        def group_consume():
            """Group consumption mode"""
            _message_ret = [[[], [], []]]
            if self._last_event_id is None:
                # Ensuring the presence of consumption groups
                RedisAdmin.add_group_to_stream(
                    self._redis_client, self.topic_name, self.group_id)

            if self._enable_heartbeat:
                _message_ret = self._heartbeat_checkout(batch_consume_limit)

            if self._enable_pending_list_transfer:
                _message_ret = self._pending_list_transfer(batch_consume_limit)

            if len(_message_ret[0][1]) <= 0:
                # Determine whether the message needs to be pulled from the
                # pending list
                # 1. After the instance is created, the first consumption will
                #    try to get the message of the pending list, that is, the
                #    current consumer (consumer_id distinguishes different
                #    consumers, and the RedisConsumer instance created with the
                #    same consumer_id represents The same consumer) pulled the
                #    message list from the event center, but the unconfirmed
                #    message list;
                # 2. Considering that there may be more unconfirmed message
                #    lists, you can't pull it all at once, so if you
                #    successfully pull from the pending list to the message,
                #    '_is_need_fetch_pending_message' will remain unchanged,
                #    and try to get from pending list next time.
                # 3. If the message is not pulled from the pending list, set
                #    '_is_need_fetch_pending_message' to False, and this
                #    RedisConsumer will not attempt from pending List pull
                #    message
                if self._is_need_fetch_pending_message:
                    _message_ret = self._redis_client.xreadgroup(
                        self.group_id, self.consumer_id, {
                            self.inner_topic_name: '0-0'
                        }, count=batch_consume_limit, block=timeout,
                        noack=auto_ack
                    )
                    if len(_message_ret[0][1]) == 0:
                        self._is_need_fetch_pending_message = False
                        _message_ret = self._redis_client.xreadgroup(
                            self.group_id, self.consumer_id, {
                                self.inner_topic_name: '>'
                            }, count=batch_consume_limit, block=timeout,
                            noack=auto_ack
                        )
                else:
                    _message_ret = self._redis_client.xreadgroup(
                        self.group_id, self.consumer_id, {
                            self.inner_topic_name: '>'
                        }, count=batch_consume_limit, block=timeout,
                        noack=auto_ack
                    )

            # Update status and perform necessary clearance tasks
            self.consume_status_storage.update()
            return _message_ret

        def broadcast_consume():
            """Broad consumption mode"""
            if self._last_event_id is None:
                # Indicates the first call to the consumer method since the
                # Consumer was instantiated, doing some initialization
                return self._redis_client.xread({
                    self.inner_topic_name: '$'
                    if self.consume_mode ==
                       ConsumeMode.CONSUME_FROM_NOW else '0-0'
                }, count=batch_consume_limit, block=timeout)
            # Take out the messages in sequential order
            return self._redis_client.xread({
                self.inner_topic_name: self._last_event_id
            }, count=batch_consume_limit, block=timeout)

        timeout = 0 if timeout <= 0 else timeout
        batch_consume_limit = self.default_batch_consume_limit if \
            batch_consume_limit <= 0 else batch_consume_limit

        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to consume one message from "
            f"{self.topic_name} in {self.consume_mode}.")
        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            message_ret = group_consume()
        else:
            message_ret = broadcast_consume()
        if len(message_ret) < 1 or len(message_ret[0]) < 2 or len(
                message_ret[0][1]) < 1:
            LoggerHelper.get_lazy_logger().warning(
                f"{self} read some message from "
                f"{self.topic_name}, but its invalid. => "
                f"{message_ret}")
            return []
        messages: List[Event] = []
        for message_tuple in message_ret[0][1]:
            self._last_event_id = message_tuple[0]

            # Filter out events that are not cast through the cec interface
            if StaticConst.REDIS_CEC_EVENT_VALUE_KEY not in message_tuple[1]:
                continue

            message_content = message_tuple[1].get(
                StaticConst.REDIS_CEC_EVENT_VALUE_KEY)
            message_type = message_tuple[1].get(
                StaticConst.REDIS_CEC_EVENT_VALUE_TYPE_KEY, 0)
            if message_type == StaticConst.REDIS_CEC_EVENT_VALUE_TYPE_DICT:
                message_content = json.loads(message_content)
            elif message_type == StaticConst.REDIS_CEC_EVENT_VALUE_TYPE_BYTES:
                message_content = message_content.encode(encoding="utf-8")
            msg = Event(message_content, message_tuple[0])
            messages.append(msg)
            LoggerHelper.get_lazy_logger().debug(
                f"{self} read one message from {self.topic_name} success "
                f"=> {msg}")
        return messages

    @logger.catch(reraise=True)
    def ack(self, event: Event, **kwargs) -> int:
        """Confirm that the specified event has been successfully consumed

        Acknowledgement of the specified event
        1. The event should normally be acknowledged after it has been taken
           out and successfully processed.

        Args:
            event(Event): Events to be confirmed
                1. Must be an instance of the Event obtained through Consumer
                   interface;
                2. Passing in a self-constructed Event does not guarantee that
                   the result will be as expected.

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
        # Use pipeline to speed up
        # 1. Record the latest acked ID of the current topic-consumer group
        pipeline = self._redis_client.pipeline()
        key = get_topic_consumer_group_meta_info_key(
            self.topic_name,
            self.group_id,
            StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID)
        pipeline.set(
            key,
            event.event_id
        )
        # 2. Acknowledgement of the event
        pipeline.xack(self.inner_topic_name, self.group_id, event.event_id)

        # 3. Record acked ID
        self.consume_status_storage.do_after_ack_by_pl(pipeline, event)
        rets = pipeline.execute()
        LoggerHelper.get_lazy_logger().info(
            f"{self} ack '{event.event_id}' successfully"
        )
        return rets[1]

    @logger.catch(reraise=True)
    def __next__(self):
        msg = None
        try:
            if not self._event_cache_queue.empty():
                msg = self._event_cache_queue.get()
            else:
                for new_msg in self.consume():
                    self._event_cache_queue.put(new_msg)
                if not self._event_cache_queue.empty():
                    msg = self._event_cache_queue.get()
        except redis.exceptions.ConnectionError:
            pass
        finally:
            if msg is None:
                raise StopIteration()
        return msg

    @logger.catch(reraise=True)
    def connect_by_cec_url(self, url: CecUrl):
        """Connect to redis server by CecUrl

        Connecting to the Redis server via CecUrl

        Args:
          url(str): CecUrl
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to connect to '{url}'.")
        self._redis_client = do_connect_by_cec_url(url)
        self._current_url = str(url)

        # If it is group consumption mode, check if the consumer group exists
        if self.consume_mode == ConsumeMode.CONSUME_GROUP:
            # Try to create a consumer group, ignore if it already exists,
            # create if it doesn't
            static_create_consumer_group(self._redis_client,
                                         self.group_id,
                                         ignore_exception=True)
            RedisAdmin.add_group_to_stream(
                self._redis_client, self.topic_name, self.group_id)
            self.consume_status_storage = ConsumeStatusStorage(
                self._redis_client,
                self.topic_name,
                self.group_id
            )
        else:
            self._enable_heartbeat = False

        if self._enable_heartbeat:
            self._heartbeat = Heartbeat(
                self._redis_client, self.inner_topic_name, self.group_id,
                self.consumer_id,
                heartbeat_interval=self.get_special_param(
                    StaticConst.REDIS_SPECIAL_PARM_CEC_HEARTBEAT_INTERVAL
                ),
                heartbeat_check_interval=self.get_special_param(
                    StaticConst.REDIS_SPECIAL_PARM_CEC_HEARTBEAT_CHECK_INTERVAL
                ),
            )
            self._heartbeat.start()
        LoggerHelper.get_lazy_logger().success(
            f"{self} connect to '{url}' successfully.")
        return self

    @logger.catch(reraise=True)
    def connect(self, url: str):
        """Connect to redis server by url

        Connecting to the remote message queue => Corresponding to this module
        is connecting to the Redis server.

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

        Disconnect from remote server => Corresponds to this module as
        disconnecting the Redis server.
        """
        if self._redis_client is None:
            return
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to disconnect from '{self._current_url}'.")
        if self._heartbeat is not None:
            self._heartbeat.stop()
            self._heartbeat = None
        self._redis_client.close()
        self._redis_client.connection_pool.disconnect()
        self._redis_client = None
        LoggerHelper.get_lazy_logger().success(
            f"{self} disconnect from '{self._current_url}' successfully.")
