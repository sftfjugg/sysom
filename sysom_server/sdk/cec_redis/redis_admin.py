# -*- coding: utf-8 -*- #
"""
Time                2022/7/29 11:25
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_admin.py
Description:
"""

import json
from typing import Optional, List

import redis.exceptions
from cec_base.admin import Admin, ConsumeStatusItem
from cec_base.exceptions import CecException
from cec_base.event import Event
from cec_base.meta import ConsumerGroupMeta, TopicMeta
from cec_base.log import LoggerHelper
from cec_base.url import CecUrl
from redis import Redis
from redis.exceptions import ResponseError
from loguru import logger
from .utils import raise_if_not_ignore, do_connect_by_cec_url
from .consume_status_storage import ConsumeStatusStorage
from .common import StaticConst, ClientBase
from .admin_static import static_create_topic, static_del_topic, \
    static_is_topic_exist, static_get_topic_list, \
    static_create_consumer_group, static_del_consumer_group, \
    static_is_consumer_group_exist, static_get_consumer_group_list, \
    get_topic_consumer_group_meta, get_sub_list_key


class RedisAdmin(Admin, ClientBase):
    """A redis-based execution module implement of Admin

    Admin implementation in an execution module based on the Redis.

    """

    def __init__(self, url: CecUrl):
        Admin.__init__(self)
        ClientBase.__init__(self, url)
        self._redis_client: Optional[Redis] = None
        self._current_url: str = ""
        self.connect_by_cec_url(url)

    ####################################################################
    # Event Center Admin Interface Implementation
    ####################################################################

    @logger.catch(reraise=True)
    def create_topic(self, topic_name: str = "", num_partitions: int = 1,
                     replication_factor: int = 1, **kwargs) -> bool:
        """Create one topic

        Creating a Topic => Corresponding to Redis should be creating a Stream:
            1. First determine whether Topic already exists and, if so, throw
               an exception;
            2. Then use the xadd command to trigger the stream creation
               process;
            3. Thirdly, delete the test data you just inserted and clear
               the stream;
            4. Finally, add the topic_name to a specific set
               (This collection contains a list of all the Topic names created
               through the CEC)

        TODO: This is where further consideration needs to be given to the use
              of transactions to prevent errors in execution at an intermediate
              step and inconsistent state

        Args:
            topic_name(str): Topic name (unique identification of the topic)
            num_partitions(int): Number of partitions of the topic
            replication_factor(int): Redundancy factor (specifies how many
                                     copies of the data for the subject should
                                     be kept in the event center)
        Keyword Args:
            ignore_exception: Whether to ignore exceptions that may be thrown
            expire_time: Event timeout time (in ms, default: 1day)

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicAlreadyExistsException: If topic already exists
            CecException: Get lock failed

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_topic("test_topic")
            True
        """
        return static_create_topic(
            self._redis_client,
            topic_name,
            num_partitions,
            replication_factor,
            **kwargs
        )

    @logger.catch(reraise=True)
    def del_topic(self, topic_name: str, **kwargs) -> bool:
        """Delete one topic

        Deleting a Topic => Corresponding to redis should be deleting a stream
            1. Just delete the key corresponding to the stream
            2. Clear some relevant metadata information

        Args:
            topic_name(str): Topic name

        Keyword Args
            ignore_exception: Whether to ignore exceptions that may be thrown

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicNotExistsException: If topic not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_topic("test_topic")
            True
        """
        return static_del_topic(self._redis_client, topic_name, **kwargs)

    @logger.catch(reraise=True)
    def is_topic_exist(self, topic_name: str, **kwargs) -> bool:
        """Judge whether one specific topic is exists

        Determine if Topic exists => Corresponds to Redis should be to
        determine if the most corresponding stream exists
            1. Use the type command to determine whether the type of the key
               is 'stream'

        Args:
            topic_name(str): Topic name

        Keyword Args:

        Returns:
            bool: True if topic exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_topic_exist("test_topic")
            True
        """
        return static_is_topic_exist(self._redis_client, topic_name, **kwargs)

    @logger.catch(reraise=True)
    def get_topic_list(self, **kwargs) -> List[TopicMeta]:
        """Get topic list

        Getting the Topic list => corresponding to Redis should be a list of
        all Streams.
            1. This implementation creates a special Set that holds the keys
               of all Streams created by this set of interfaces;
            2. So just query the Set and get all the keys.

        Args:

        Keyword Args:

        Returns:
            [str]: The topic name list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_topic_list()
            ['test_topic']
        """
        return static_get_topic_list(self._redis_client, **kwargs)

    @staticmethod
    @logger.catch(reraise=True)
    def get_meta_info(client: Redis, topic_name: str) -> Optional[dict]:
        """Get topic's meta info

        Get metadata information for a specific topic

        Args:
          client(Redis): Redis client
          topic_name(str): topic name

        Returns:
            TopicMeta: the topic meta info object
        """
        try:
            res = client.xinfo_stream(
                StaticConst.get_inner_topic_name(topic_name))
        except ResponseError:
            return None
        LoggerHelper.get_lazy_logger().debug(
            f"get_meta_info => {res}.")
        return {
            'topic_name': topic_name,
            **res
        }

    @logger.catch(reraise=True)
    def create_consumer_group(self, consumer_group_id: str, **kwargs) -> bool:
        """Create one consumer group

        Create a consumer group
            1. The concept of a consumption group in Redis is for each Stream,
               the same consumer group cannot consume multiple Streams;
            2. This implementation creates a special Set that holds all
               consumer groups created by this set of interfaces, and creates
               them if the group does not exist when group consumption is
               performed on a Stream;
            3. Then create a list with ConsumerId as the key to store all the
               Streams related to that consumer, to ensure that when a consumer
               group is deleted, this consumer group should be removed from all
               subscribed streams

        Args:
            consumer_group_id(str): Consumer group ID

        Keyword Args:
            ignore_exception: Whether to ignore exceptions that may be thrown

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            ConsumerGroupAlreadyExistsException: If consumer group already
            exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_consumer_group("test_group")
            True
        """
        return static_create_consumer_group(self._redis_client,
                                            consumer_group_id,
                                            **kwargs)

    @logger.catch(reraise=True)
    def del_consumer_group(self, consumer_group_id: str, **kwargs) -> bool:
        """Delete one consumer group

        Delete consumer group
            1. First determine if the consumer group exists, and if not,
               throw an exception as appropriate;
            2. Removal from the set of consumer groups;
            3. Destroy all consumer group structures of the same name in all
               streams associated with the current consumption group.

        Args:
            consumer_group_id(str): Consumer group ID

        Keyword Args:
            ignore_exception: Whether to ignore exceptions that may be thrown

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            ConsumerGroupNotExistsException: If consumer group not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_consumer_group("test_group")
            True
        """
        return static_del_consumer_group(self._redis_client, consumer_group_id,
                                         **kwargs)

    @logger.catch(reraise=True)
    def is_consumer_group_exist(self, consumer_group_id: str,
                                **kwargs) -> bool:
        """Judge whether one specific consumer group exists

        Determines whether the specific consumer group exists
            1. Determine whether the set storing all consumer group keys
               contains the specified consumer id;
            2. Also determine if consumer_group_id is a key, and if it is
               occupied, also report it as existing and not allowed to create.

        Args:
            consumer_group_id(str): Consumer group ID

        Keyword Args:
            ignore_exception: Whether to ignore exceptions that may be thrown

        Returns:
            bool: True if consumer group exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_consumer_group_exist("test_group")
            True
        """
        return static_is_consumer_group_exist(self._redis_client,
                                              consumer_group_id)

    @logger.catch(reraise=True)
    def get_consumer_group_list(self, **kwargs) -> List[ConsumerGroupMeta]:
        """Get consumer group list

        Get consumer group list
            1. Since in Redis, consumer groups belong to Streams, and consumer
               groups of different Streams are independent, a special set
               _REDIS_ADMIN_CONSUMER_GROUP_LIST_SET stores the names of all
               consumer groups in order to achieve the purpose that the same
               consumer group can consume different Topics;
            2. When a consumer group tries to consume a Stream, cec-redis
               automatically determines if the Stream contains the consumer
               group and automatically creates it if it does not;
            3. So you can get the list of consumer groups directly from
               _REDIS_ADMIN_CONSUMER_GROUP_LIST_SET.

        Returns:
            [ConsumerGroupMeta]: The consumer group list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consumer_group_list()
            ['test_group']
        """
        return static_get_consumer_group_list(self._redis_client, **kwargs)

    @logger.catch(reraise=True)
    def get_consume_status(
            self, topic: str, consumer_group_id: str = "", partition: int = 0,
            **kwargs) -> List[ConsumeStatusItem]:
        """Get consumption info for specific <topic, consumer_group, partition>

        Get the consumption info of a particular topic by a particular consumer
        group.

        Args:
            topic(str): Topic name
            consumer_group_id(str): Consumer group ID
                1. If consumer_group_id == '' or None, returns the consumption
                   info of all consumer groups subscribed to the topic;
                   => In this case the partition parameter is invalid
                   (will get consumption info for all partitions)
                2. Throws an exception if consumer_group_id is an invalid group
                   ID;
                3. If consumer_group_id is a valid group ID, then only get
                   consumption info of the specified consumption group.
            partition: Partition ID
                1. If partition specifies a valid non-negative integer
                   => returns the consumption info of the specified partition;
                2. Throws an exception if partition specifies an invalid
                   non-negative integer;
                3. If partition specifies a negative number => returns the
                   consumption info of all partitions under the current topic.

        Raises:
            CecException

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consume_status("topic1")
            [
                {
                    "topic":"topic1",
                    "consumer_group_id":"c78e8b71-45b9-4e11-8f8e-05a98b534cc0",
                    "min_id":"1661516434003-0",
                    "max_id":"1661516434004-4",
                    "total_event_count":10,
                    "last_ack_id":"1661516434003-4",
                    "lag":5
                },
                {
                    "topic":"topic1",
                    "consumer_group_id":"d1b39ec3-6ae9-42a6-83b5-257d875788e6",
                    "min_id":"1661516434003-0",
                    "max_id":"1661516434004-4",
                    "total_event_count":10,
                    "last_ack_id":"1661516434003-1",
                    "lag":8
                }
            ]

        Returns:

        """

        def _get_one_group_consume_status(_groups: List[dict]) \
                -> List[ConsumeStatusItem]:
            """Get the consumption of the specified consumer group"""
            select_group = None
            # Attempt to obtain consumption information for the specified
            # consumer group
            for _group in _groups:
                if _group.get('name') == consumer_group_id:
                    select_group = _group
                    break
            if select_group is None:
                # Consumer group not exists
                raise CecException(
                    f"Consumer group {consumer_group_id} not exists or did "
                    f"not subscribe topic {topic}")

            # Since the current implementation of cec-redis does not support
            # partitioning, each topic has one and only one partition number
            # and the partition number is 0. If a consumption group is
            # specified, the partition number passed in <= 0 is considered
            # valid; the partition number passed in > 0 is considered invalid.
            if partition > 0:
                raise CecException(
                    f"Topic {topic} did not contains partition {partition}"
                )

            # Here it is sufficient to return the consumption of the
            # specified consumer group
            last_ack_id = get_topic_consumer_group_meta(
                self._redis_client, topic, select_group.get('name'),
                StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID
            )

            # Get LAG
            if self.is_gte_7(self._redis_client):
                lag = select_group['lag'] + select_group['pending']
            else:
                lag = ConsumeStatusStorage.get_already_ack_count(
                    self._redis_client, topic, consumer_group_id
                )

            return [
                ConsumeStatusItem(
                    topic, consumer_group_id, 0,
                    min_id=min_id,
                    max_id=max_id,
                    total_event_count=length,
                    last_ack_id=last_ack_id,
                    lag=lag
                )
            ]

        def _get_all_group_consume_status(_groups: List[dict]) \
                -> List[ConsumeStatusItem]:
            """Get the consumption of the all consumer group"""
            # 获取所有消费组的消费情况（此时 partition 参数无效）
            res, counts_map = [], {}
            if not self.is_gte_7(self._redis_client):
                # 如果 Redis 版本小于7，将使用 ConsumeStatusStorage 获取 lag
                pipeline = self._redis_client.pipeline()
                for _group in _groups:
                    ConsumeStatusStorage.get_already_ack_count(
                        pipeline, topic, _group.get('name')
                    )
                counts = pipeline.execute()
                for i, _group in enumerate(_groups):
                    counts_map[_group.get('name')] = counts[i]

            for _group in _groups:
                last_ack_id = get_topic_consumer_group_meta(
                    self._redis_client, topic, _group.get('name'),
                    StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID
                )

                # 获取 LAG
                if 'lag' in _group and 'pending' in _group:
                    lag = _group['lag'] + _group['pending']
                else:
                    lag = length - counts_map[_group.get('name')]

                res.append(ConsumeStatusItem(
                    topic, _group.get('name'), 0,
                    min_id=min_id,
                    max_id=max_id,
                    total_event_count=length,
                    last_ack_id=last_ack_id,
                    lag=lag
                ))
            return res

        inner_topic_name = StaticConst.get_inner_topic_name(topic)

        # Use 'xinfo stream' to get topic information
        try:
            stream_info = self._redis_client.xinfo_stream(inner_topic_name)
            first_entry = stream_info.get("first-entry", None)
            last_entry = stream_info.get("last-entry", None)
            min_id = first_entry[0] if first_entry is not None else None
            max_id = last_entry[0] if last_entry is not None else None
            length = stream_info.get("length", 0)
            groups = self._redis_client.xinfo_groups(inner_topic_name)
            if consumer_group_id != '' and consumer_group_id is not None:
                return _get_one_group_consume_status(groups)
            return _get_all_group_consume_status(groups)
        except redis.exceptions.RedisError as exc:
            raise CecException(exc) from exc

    @logger.catch(reraise=True)
    def get_event_list(self, topic: str, partition: int, offset: str,
                       count: int, **kwargs) -> List[Event]:
        """ Get event list for specific <topic, partition>

        Get a list of messages for a specific topic under a specified partition
        => Use the xrange command in Redis to get the messages in a stream
        1. offset and count for paging

        Args:
            topic(str): Topic name
            partition(int): Partition ID => There is no partition in Redis, so
                            this parameter is invalid
            offset(int): Offset (want to read messages after this ID)
            count(int): Maximum number of reads

        References:
            https://redis.io/commands/xrange/

        Returns:

        """
        ignore_exception = kwargs.get("ignore_exception", False)
        inner_topic_name = StaticConst.get_inner_topic_name(topic)
        res = []
        try:
            messages = self._redis_client.xrange(
                inner_topic_name,
                min=f"({offset}",
                max='+',
                count=count
            )
            for message in messages:
                message_content = json.loads(
                    message[1][StaticConst.REDIS_CEC_EVENT_VALUE_KEY])
                res.append(Event(message_content, message[0]))
        except redis.exceptions.RedisError as exc:
            raise_if_not_ignore(ignore_exception, exc)
        return res

    @staticmethod
    @logger.catch(reraise=True)
    def add_group_to_stream(redis_client: Redis, stream: str,
                            consumer_group_id: str) -> bool:
        """Add one consumer group to stream

        Add the consumer group to the corresponding stream

        Args:
          redis_client(Redis): Redis client
          stream(str): Stream(Topic) name
          consumer_group_id(str): Consumer group id

        Returns:
            bool: True if successfully, False otherwise.
        """
        inner_topic_name = StaticConst.get_inner_topic_name(stream)
        try:
            LoggerHelper.get_lazy_logger().debug(
                f"try to add consumer group '{consumer_group_id}"
                f"' to topic '{stream}'.")
            redis_client.xgroup_create(
                inner_topic_name,
                consumer_group_id, id="0-0")
        except ResponseError:
            LoggerHelper.get_lazy_logger().debug(
                f"Consumer group '{consumer_group_id}"
                f"' already exists.")
            return False
        else:
            redis_client.lpush(
                get_sub_list_key(consumer_group_id),
                inner_topic_name
            )
        LoggerHelper.get_lazy_logger().debug(
            f"Add consumer group '{consumer_group_id}"
            f"' to topic '{stream}' successfully.")
        return True

    @logger.catch(reraise=True)
    def is_support_partitions(self, **kwargs) -> bool:
        return False

    @logger.catch(reraise=True)
    def is_support_replication(self, **kwargs) -> bool:
        return False

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

    @logger.catch()
    def __del__(self):
        self.disconnect()

    @logger.catch(reraise=True)
    def client(self):
        """Get inner redis client

        Returns:

        """
        return self._redis_client
