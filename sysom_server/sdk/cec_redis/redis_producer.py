# -*- coding: utf-8 -*- #
"""
Time                2022/8/11 14:30
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_producer.py
Description:
"""
import json
from typing import Callable, Union, Optional

from redis import Redis
from loguru import logger
from cec_base.producer import Producer
from cec_base.event import Event
from cec_base.url import CecUrl
from cec_base.exceptions import TopicNotExistsException
from cec_base.log import LoggerHelper
from .utils import do_connect_by_cec_url
from .redis_admin import RedisAdmin
from .common import StaticConst, ClientBase
from .admin_static import static_create_topic


class RedisProducer(Producer, ClientBase):
    """A redis-based execution module implement of Producer

    Producer implementation in an execution module based on the Redis.

    """

    def __init__(self, url: CecUrl):
        Producer.__init__(self)
        ClientBase.__init__(self, url)
        self._current_url = ""

        # Handles Redis implementation of event-centric specialization
        # parameters
        self.default_max_len = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN
        )
        self.auto_mk_topic = self.get_special_param(
            StaticConst.REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC
        )

        # 1. Connect to the Redis server
        self._redis_client: Optional[Redis] = None
        self.connect_by_cec_url(url)

        # 2. Create a new dict to hold the topic_name => TopicMeta mapping
        #    relationship
        self._topic_metas = {

        }

    @logger.catch(reraise=True)
    def produce(self, topic_name: str, message_value: Union[bytes, dict],
                callback: Callable[[Exception, Event], None] = None,
                **kwargs):
        """Generate one new event, then put it to event center

        发布一个事件到事件中心 => 对应到 Redis 就是生产一个消息注入到 Stream 当中

        Args:
            topic_name(str): Topic name
            message_value(bytes | dict): Event value
            callback(Callable[[Exception, Event], None]): Event delivery
                                                          results callback

        Keyword Args
            partition(int): Partition ID
                1. If a valid partition number is specified, the event is
                   deliverd to the specified partition (not recommended);
                2. A positive partition ID is passed, but no such partition is
                   available, an exception will be thrown.
                3. A negative partition number is passed (e.g. -1), then the
                   event will be cast to all partitions in a balanced manner
                   using the built-in policy (recommended).

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
        # Determine whether there is metadata information for the target
        # topic
        if inner_topic_name not in self._topic_metas or \
                self._topic_metas[inner_topic_name] is None:
            # Pulling metadata information
            self._topic_metas[inner_topic_name] = RedisAdmin.get_meta_info(
                self._redis_client, topic_name)

            # If the metadata information is invalid, the topic does not exist
            if self._topic_metas[inner_topic_name] is None:
                if self.auto_mk_topic:
                    # If you set the theme to be created automatically if it
                    # does not exist, try to create the theme
                    topic_exist = static_create_topic(
                        self._redis_client,
                        topic_name)
                    LoggerHelper.get_lazy_logger().debug(
                        f"{self} try to auto create topic: {topic_exist}"
                    )
            else:
                topic_exist = True
        else:
            topic_exist = True

        err, event_id = None, None
        if not topic_exist:
            LoggerHelper.get_lazy_logger().error(
                f"{self} Topic ({topic_name}) not exists.")
            # Topic not exists
            err = TopicNotExistsException(
                f"Topic ({topic_name}) not exists.")
        else:
            # Deliver the message in the corresponding topic
            if 'maxlen' not in kwargs:
                kwargs['maxlen'] = self.default_max_len
            event_id = self._redis_client.xadd(inner_topic_name, {
                StaticConst.REDIS_CEC_EVENT_VALUE_KEY: json.dumps(
                    message_value) if isinstance(message_value,
                                                 dict) else message_value
            }, **kwargs)

            # Additional processing if topice does not exist
            if event_id is None:
                err = TopicNotExistsException(
                    f"Topic ({topic_name}) not exists.")
            else:
                LoggerHelper.get_lazy_logger().info(
                    f"{self} produce one message '{event_id}'=>"
                    f"{message_value} successfully."
                )

        if callback is not None:
            callback(err, Event(message_value, event_id))

    @logger.catch(reraise=True)
    def flush(self, timeout: int = -1, **kwargs):
        """Flush all cached event to event center

        Deliver all events in the cache that have not yet been committed into
        the event center (this is a blocking call)

        Args:
            timeout(int): Blocking wait time
                          (Negative numbers represent infinite blocking wait)

        Notes: The RedisProducer's produce func is currently blocking, so the
               flush func can be empty

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
            >>> producer.flush()
        """

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
        self._redis_client.quit()
        self._redis_client = None
        LoggerHelper.get_lazy_logger().success(
            f"{self} disconnect from '{self._current_url}' successfully.")
