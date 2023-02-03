# -*- coding: utf-8 -*- #
"""
Time                2022/7/26 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                admin.py
Description:
"""
import importlib
import json
import functools
from typing import List
from abc import ABCMeta, abstractmethod
import anyio
from .base import Connectable
from .exceptions import CecProtoAlreadyExistsException, \
    CecProtoNotExistsException
from .event import Event
from .meta import TopicMeta, \
    ConsumerGroupMemberMeta
from .url import CecUrl
from .log import LoggerHelper


class ConsumeStatusItem:
    """Consume status

    Consume status => which indicate consume status of a particular topic
    by a particular consumer group.

    Args:
        topic(str): Topic name
        consumer_group_id(str): Consumer group ID
        partition(int): Topic partition ID

    Keyword Args
        min_id(str): Minimum ID/offset
        max_id(str): Maximum ID/offset
        total_event_count(int): Total number of events stored in the partition
                           (both consumed and unconsumed)
        last_ack_id(str): ID of the last acknowledged event of the current
                          consumer group in the partition.
                          (ID of the last consumer-acknowledged event)
        lag(int): Number of messages stacked in the partition LAG
                  (number of events that have been submitted to the partition,
                  but not consumed or acknowledged by a consumer in the current
                  consumer group)

    """

    # pylint: disable=too-many-instance-attributes
    # Eight is reasonable in this case.
    def __init__(self, topic: str, consumer_group_id: str, partition: int,
                 **kwargs):
        self.topic = topic
        self.consumer_group_id = consumer_group_id
        self.partition = partition
        self.min_id = kwargs.get("min_id", "")
        self.max_id = kwargs.get("max_id", "")
        self.total_event_count = kwargs.get("total_event_count", 0)
        self.last_ack_id = kwargs.get("last_ack_id", "")
        self.lag = kwargs.get("lag", 0)

    def __repr__(self):
        return json.dumps(self.__dict__)

    def __str__(self):
        return json.dumps(self.__dict__)


# pylint: disable=too-many-public-methods
# 25 is reasonable in this case.
class Admin(Connectable, metaclass=ABCMeta):
    """Common Event Center Management interface definition

    This interface defines the generic behavior of the CEC Admin.

    """

    proto_dict = {

    }

    @abstractmethod
    def create_topic(self, topic_name: str = "", num_partitions: int = 1,
                     replication_factor: int = 1, **kwargs) -> bool:
        """Create one topic

        Create a topic in the Event Center.

        Args:
            topic_name(str): Topic name (unique identification of the topic)
            num_partitions(int): Number of partitions of the topic
                1. This parameter specifies that in a distributed cluster
                   deployment scenario, data on the same topic should be
                   partitioned into several partitions, stored on separate
                   cluster nodes.
                2. If the underlying message queue supports partition
                   (e.g., Kafka), then partition can be performed based
                   on this param.
                3. If the underlying messaging queue does not support partition
                   (e.g. Redis), this parameter is ignored (it is assumed that
                   there is only one partition).
                   The Admin.is_support_partitions() method can be used to
                   determine whether the underlying message queue currently
                   in use supports this feature.

            replication_factor(int): Redundancy factor (specifies how many
                                     copies of the data for the subject should
                                     be kept in the event center)

                1. This parameter specifies the number of copies of partitions
                   of the same topic that exist in a distributed cluster
                   deployment scenario; if replication_factor == 1, it
                   indicates that all partitions under the topic have only one
                   copy and are not reversible in case of loss.
                2. If the underlying message queue supports data replication,
                   the corresponding settings can be made based on this param.
                3. If the underlying message queue does not support data
                   replication, this parameter is ignored (i.e. it is assumed
                   that only one replica is available).
                   The Admin.is_support_replication() method can be used to
                   determine whether the underlying message queue currently
                   in use supports this feature.

        Keyword Args:
            ignore_exception: Whether to ignore exceptions that may be thrown
            expire_time: Event timeout time (in ms, default: 1day)

                1. This parameter specifies the validity of each event in the
                   target Topic.
                2. Once an event has been added to Topic for longer than the
                   expire_time, CEC does not guarantee persistence of the
                   event and CEC shall remove the timed out event when
                   appropriate.
                3. Instead of forcing time-out events to be deleted immediately
                   , time-out events can be cleaned up periodically.
        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicAlreadyExistsException: If topic already exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_topic("test_topic")
            True
        """

    async def create_topic_async(self, topic_name: str = "",
                                 num_partitions: int = 1,
                                 replication_factor: int = 1,
                                 **kwargs) -> bool:
        """Create one topic by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.create_topic, **kwargs),
            topic_name, num_partitions, replication_factor
        )

    @abstractmethod
    def del_topic(self, topic_name: str, **kwargs) -> bool:
        """Delete one topic

        Delete a topic in the Event Center.

        Args:
            topic_name(str): Topic name (unique identification of the topic)

        Keyword Args:
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

    async def del_topic_async(self, topic_name: str, **kwargs) -> bool:
        """Delete one topic by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.del_topic, **kwargs),
            topic_name
        )

    @abstractmethod
    def is_topic_exist(self, topic_name: str, **kwargs) -> bool:
        """Determine whether one specific topic exists

        Determines whether the target topic exists in the currently used event
        center.

        Args:
            topic_name(str): Topic name (unique identification of the topic)

        Returns:
            bool: True if topic exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_topic_exist("test_topic")
            True
        """

    async def is_topic_exist_async(self, topic_name: str, **kwargs) -> bool:
        """Determine whether one specific topic exists by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.is_topic_exist, **kwargs),
            topic_name
        )

    @abstractmethod
    def get_topic_list(self, **kwargs) -> List[TopicMeta]:
        """Get topic list

        Get a list of topics contained in the event center currently in use.

        Args:

        Returns:
            [str]: The topic meta info list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_topic_list()
            [TopicMeta(faeec676-60db-4418-a775-c5f1121d5331, 1)]
        """

    async def get_topic_list_async(self, **kwargs) -> List[TopicMeta]:
        """Get topic list by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.get_topic_list, **kwargs)
        )

    @abstractmethod
    def create_consumer_group(self, consumer_group_id: str, **kwargs) -> bool:
        """Create one consumer group

        Create a consumer group in the Event Center

        Args:
            consumer_group_id: Consumer group ID, which should be unique

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

    async def create_consumer_group_async(self, consumer_group_id: str,
                                          **kwargs) -> bool:
        """Create one consumer group by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.create_consumer_group, **kwargs),
            consumer_group_id
        )

    @abstractmethod
    def del_consumer_group(self, consumer_group_id: str, **kwargs) -> bool:
        """Delete one consumer group

        Delete a consumer group in the Event Center

        Args:
            consumer_group_id: Consumer group ID, which should be unique

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

    async def del_consumer_group_async(self, consumer_group_id: str,
                                       **kwargs) -> bool:
        """Delete one consumer group by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.del_consumer_group, **kwargs),
            consumer_group_id
        )

    @abstractmethod
    def is_consumer_group_exist(self, consumer_group_id: str,
                                **kwargs) -> bool:
        """Determine whether one specific consumer group exists

        Determines whether the target consumer group exists in the currently
        used event center.

        Args:
            consumer_group_id: Consumer group ID, which should be unique

        Keyword Args:

        Returns:
            bool: True if consumer group exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_consumer_group_exist("test_group")
            True
        """

    async def is_consumer_group_exist_async(self, consumer_group_id: str,
                                            **kwargs) -> bool:
        """Determine whether one specific consumer group exists by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.is_consumer_group_exist, **kwargs),
            consumer_group_id
        )

    @abstractmethod
    def get_consumer_group_list(self, **kwargs) -> \
            List[ConsumerGroupMemberMeta]:
        """Get consumer group list

        Get a list of consumer groups contained in the event center currently
        in use.

        Returns:
            [str]: The consumer group list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consumer_group_list()
        """

    async def get_consumer_group_list_async(self, **kwargs) -> \
            List[ConsumerGroupMemberMeta]:
        """Get consumer group list by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.get_consumer_group_list, **kwargs)
        )

    @abstractmethod
    def get_consume_status(
            self, topic: str, consumer_group_id: str = "",
            partition: int = 0, **kwargs
    ) -> List[ConsumeStatusItem]:
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

    async def get_consume_status_async(
            self, topic: str, consumer_group_id: str = "",
            partition: int = 0, **kwargs
    ) -> List[ConsumeStatusItem]:
        """Get consumption info by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.get_consume_status, **kwargs),
            topic, consumer_group_id, partition
        )

    @abstractmethod
    def get_event_list(self, topic: str, partition: int, offset: str,
                       count: int, **kwargs) -> List[Event]:
        """ Get event list for specific <topic, partition>

        Get a list of messages for a specific topic under a specified partition
        1. offset and count for paging

        Args:
            topic(str): Topic name
            partition: Partition ID
            offset: Offset (want to read messages after this ID)
            count: Maximum number of reads

        Returns:

        """

    async def get_event_list_async(self, topic: str, partition: int,
                                   offset: str,
                                   count: int, **kwargs) -> List[Event]:
        """Get event list for specific <topic, partition> by async"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.get_event_list, **kwargs),
            topic, partition, offset, count
        )

    @abstractmethod
    def is_support_partitions(self, **kwargs) -> bool:
        """Is current execution module support partitions

        Returns whether the current execution module supports partitioning

        Returns:
            bool: True if current execution module support partitions, False
            otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_support_partitions()
            False
        """

    async def is_support_partitions_async(self, **kwargs) -> bool:
        """Is current execution module support partitions"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.is_support_partitions, **kwargs)
        )

    @abstractmethod
    def is_support_replication(self, **kwargs) -> bool:
        """Is current execution module support replication

        Returns whether the current execution module supports data replication

        Returns:
            bool: True if current execution module support replication, False
            otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_support_replication()
            False
        """

    async def is_support_replication_async(self, **kwargs) -> bool:
        """Is current execution module support replication"""
        return await anyio.to_thread.run_sync(
            functools.partial(self.is_support_replication, **kwargs)
        )

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        Register a new protocol => This function is called by the executing
        module to register its own implementation of Admin for the executing
        module to take effect.
        (Usually when the execution module is implemented according to the
        specification, there is no need for the developer to call this method
        manually, the abstraction layer will dynamically import)

        Args:
            proto(str): Protocol identification
            sub_class: Implementation class of Admin

        Returns:

        Examples:
            >>> Admin.register('redis', RedisAdmin)

        """
        if proto in Admin.proto_dict:
            err = CecProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Admin."
            )
            LoggerHelper.get_lazy_logger().error(err)
            raise err
        Admin.proto_dict[proto] = sub_class
        LoggerHelper.get_lazy_logger().success(
            f"Cec-base-Admin register proto '{proto}' success"
        )


def dispatch_admin(url: str, **kwargs) -> Admin:
    """Construct one Admin instance according the url

    Construct an Admin instance of the corresponding type based on the URL
    passed in.

    Args:
      url(str): CecUrl

    Returns:
        Admin: One Admin instance

    Examples:
        >>> admin = dispatch_admin("redis://localhost:6379")
    """
    cec_url = CecUrl.parse(url)
    if cec_url.proto not in Admin.proto_dict:
        # Check if dynamic import is possible
        target_module = f"cec_{cec_url.proto}.{cec_url.proto}_admin"
        try:
            module = importlib.import_module(target_module)
            Admin.register(
                cec_url.proto,
                getattr(module, f'{cec_url.proto.capitalize()}Admin')
            )
        except ModuleNotFoundError as exc:
            LoggerHelper.get_lazy_logger().error(
                f"Try to auto import module {target_module} failed."
            )
            raise CecProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Admin."
            ) from exc
    admin_instance = Admin.proto_dict[cec_url.proto](cec_url, **kwargs)
    LoggerHelper.get_lazy_logger().success(
        f"Cec-base-Admin dispatch one admin instance success. "
        f"proto={cec_url.proto}, url={url}"
    )
    return admin_instance
