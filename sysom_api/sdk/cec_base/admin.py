# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/24
Description:
"""
import importlib
import json
from abc import ABCMeta, abstractmethod
from .base import Connectable, Disconnectable
from .base import Registrable, ProtoAlreadyExistsException
from .base import ProtoNotExistsException, CecException
from .event import Event
from .meta import TopicMeta, \
    ConsumerGroupMemberMeta
from .url import CecUrl
from loguru import logger


class ConsumeStatusItem(object):
    """
    消费状态 => 表征了单个消费者组对特定主题的消费情况

    1. 最小ID（最小 offset）
    2. 最大ID（最大 offset）
    3. 分区中存储的事件总数（包括已消费的和未消费的）
    4. 最后一个当前消费组在该分区已确认的事件ID（最后一次消费者确认的事件的ID）
    5. 分区的消息堆积数量 LAG（已经提交到该分区，但是没有被当前消费者消费或确认的事件数量）
    """

    def __init__(self, topic: str, consumer_group_id: str, partition: int,
                 min_id: str = "", max_id: str = "",
                 total_event_count: int = 0, last_ack_id: str = "",
                 lag: int = 0):
        self.topic = topic
        self.consumer_group_id = consumer_group_id
        self.partition = partition
        self.min_id = min_id
        self.max_id = max_id
        self.total_event_count = total_event_count
        self.last_ack_id = last_ack_id
        self.lag = lag

    def tojson(self):
        return json.dumps(self.__dict__)

    def __repr__(self):
        return self.tojson()


class Admin(Connectable, Disconnectable, Registrable, metaclass=ABCMeta):
    """Common Event Center Management interface definition

    通用事件中心管理接口定义
    """
    protoDict = {

    }

    @abstractmethod
    def create_topic(self, topic_name: str = "", num_partitions: int = 1,
                     replication_factor: int = 1,
                     ignore_exception: bool = False,
                     expire_time: int = 24 * 60 * 60 * 1000) -> bool:
        """Create one topic

        创建主题

        Args:
            topic_name: 主题名字（主题的唯一标识）
            num_partitions: 该主题的分区数

                1. 该参数指定了在分布式集群部署的场景下，同一个主题的数据应该被划分为几个分区，分别存储在不同的集群节点上；
                2. 如果底层的消息中间件支持分区（比如：Kafka），则可以依据该配置进行分区；
                3. 如果底层的消息中间件不支持分区（比如：Redis），则忽略该参数即可（认定为只有一个分区即可），可以通过
                   Admin.is_support_partitions() 方法判定当前使用的消息中间件实现是否支持该特性；

            replication_factor: 冗余因子（指定该主题的数据又几个副本）

                1. 该参数制定了在分布式集群部署的场景下，同一个主题的分区存在副本的数量，如果 replication_factor == 1
                   则表示主题下的所有分区都只有一个副本，一旦丢失不可回复；
                2. 如果底层的消息中间件支持数据副本，则可以依据该配置进行对应的设置；
                3. 如果底层的消息中间件不支持数据副本，则忽略该参数即可（即认定只有一个副本即可），可以通过
                   Admin.is_support_replication() 方法判定当前使用的小心中间件实现是否支持该特性；

            ignore_exception: 是否忽略可能会抛出的异常
            expire_time: 事件超时时间（单位：ms，默认：1day）

                1. 该参数指定了目标 Topic 中每个事件的有效期；
                2. 一旦一个事件的加入到 Topic 的时间超过了 expire_time，则cec不保证该事件
                   的持久性，cec应当在合适的时候删除超时的事件；
                3. 不强制要求超时的事件被立即删除，可以对超时的事件进行周期性的清理。
        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicAlreadyExistsException: If topic already exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_topic("test_topic")
            True
        """
        pass

    @abstractmethod
    def del_topic(self, topic_name: str,
                  ignore_exception: bool = False) -> bool:
        """Delete one topic

        删除主题

        Args:
          topic_name: 主题名字（主题的唯一标识）
          ignore_exception: 是否忽略可能会抛出的异常

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicNotExistsException: If topic not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_topic("test_topic")
            True
        """
        pass

    @abstractmethod
    def is_topic_exist(self, topic_name: str) -> bool:
        """Judge whether one specific topic is exists
        判断某个主题是否存在

        Args:
            topic_name: 主题名字（主题的唯一标识）

        Returns:
            bool: True if topic exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_topic_exist("test_topic")
            True
        """
        pass

    @abstractmethod
    def get_topic_list(self) -> [TopicMeta]:
        """Get topic list

        获取主题列表

        Args:

        Returns:
            [str]: The topic name list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_topic_list()
            [TopicMeta(faeec676-60db-4418-a775-c5f1121d5331, 1)]
        """
        pass

    @abstractmethod
    def create_consumer_group(self, consumer_group_id: str,
                              ignore_exception: bool = False) -> bool:
        """Create one consumer group

        创建一个消费组

        Args:
            consumer_group_id: 消费组ID，应当具有唯一性
            ignore_exception: 是否忽略可能会抛出的异常

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
        pass

    @abstractmethod
    def del_consumer_group(self, consumer_group_id: str,
                           ignore_exception: bool = False) -> bool:
        """Delete one consumer group

        删除一个消费组

        Args:
            consumer_group_id: 消费组ID
            ignore_exception: 是否忽略可能会抛出的异常

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            ConsumerGroupNotExistsException: If consumer group not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_consumer_group("test_group")
            True
        """
        pass

    @abstractmethod
    def is_consumer_group_exist(self, consumer_group_id: str) -> bool:
        """Judge whether one specific consumer group exists

        判断某个消费组是否存在

        Args:
            consumer_group_id: 消费组ID

        Returns:
            bool: True if consumer group exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_consumer_group_exist("test_group")
            True
        """
        pass

    @abstractmethod
    def get_consumer_group_list(self) -> [ConsumerGroupMemberMeta]:
        """Get consumer group list

        获取消费组列表

        Returns:
            [str]: The consumer group list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consumer_group_list()
        """
        pass

    @abstractmethod
    def get_consume_status(self, topic: str, consumer_group_id: str = "",
                           partition: int = 0) -> [ConsumeStatusItem]:
        """Get consumption info for specific <topic, consumer_group, partition>

        获取特定消费者组对某个主题下的特定分区的消费情况，应包含以下数据
        1. 最小ID（最小 offset）
        2. 最大ID（最大 offset）
        3. 分区中存储的事件总数（包括已消费的和未消费的）
        4. 最后一个当前消费组在该分区已确认的事件ID（最后一次消费者确认的事件的ID）
        5. 分区的消息堆积数量 LAG（已经提交到该分区，但是没有被当前消费者消费或确认的事件数量）

        Args:
            topic: 主题名字
            consumer_group_id: 消费组ID
                1. 如果 consumer_group_id 为空字符串或者None，则返回订阅了该主题的所有
                   消费组的消费情况；=> 此时 partition 参数无效（将获取所有分区的消费数据）
                2. 如果 consumer_group_id 为无效的组ID，则抛出异常；
                3. 如果 consumer_group_id 为有效的组ID，则只获取该消费组的消费情况。
            partition: 分区ID
                1. 如果 partition 指定有效非负整数 => 返回指定分区的消费情况
                2. 如果 partition 指定无效非负整数 => 抛出异常
                3. 如果 partition 指定负数 => 返回当前主题下所有分区的消费情况

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
        pass

    @abstractmethod
    def get_event_list(self, topic: str, partition: int, offset: str,
                       count: int) -> [Event]:
        """ Get event list for specific <topic, partition>

        获取特定主题在指定分区下的消息列表
        1. offset 和 count 用于分页

        Args:
            topic: 主题名字
            partition: 分区ID
            offset: 偏移（希望读取在该 ID 之后的消息）
            count: 最大读取数量

        Returns:

        """
        pass

    @abstractmethod
    def is_support_partitions(self) -> bool:
        """Is current execution module support partitions

        返回当前执行模块是否支持分区

        Returns:
            bool: True if current execution module support partitions, False
            otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_support_partitions()
            False
        """
        pass

    @abstractmethod
    def is_support_replication(self) -> bool:
        """Is current execution module support replication

        返回当前的执行模块是否支持数据副本

        Returns:
            bool: True if current execution module support replication, False
            otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_support_replication()
            False
        """
        pass

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        注册一个新的协议 => 一个新的执行模块的 Admin 实现要生效，需要调用本方法注册（通常执行
        模块按规范编写的话，是不需要开发者手动调用本方法的，抽象层会动态导入）

        Args:
            proto: 协议标识
            sub_class: 子类

        Returns:

        Examples:
            >>> Admin.register('redis', RedisAdmin)

        """
        if proto in Admin.protoDict:
            err = ProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Admin."
            )
            logger.error(err)
            raise err
        Admin.protoDict[proto] = sub_class
        logger.success(f"Cec-base-Admin register proto '{proto}' success")


def dispatch_admin(url: str, **kwargs) -> Admin:
    """Construct one Admin instance according the url

    根据传入的 URL，构造对应类型的 Admin 实例

    Args:
      url: CecUrl

    Returns:
        Admin: One Admin instance

    Examples:
        >>> admin = dispatch_admin("redis://localhost:6379")
    """
    cec_url = CecUrl.parse(url)
    if cec_url.proto not in Admin.protoDict:
        # 检查是否可以动态导入
        target_module = f"sdk.cec_{cec_url.proto}.{cec_url.proto}_admin"
        try:
            module = importlib.import_module(target_module)
            Admin.protoDict[cec_url.proto] = \
                getattr(module, f'{cec_url.proto.capitalize()}Admin')
        except ModuleNotFoundError:
            logger.error(
                f"Try to auto import module {target_module} failed.")
            err = ProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Admin."
            )
            raise err
    admin_instance = Admin.protoDict[cec_url.proto](cec_url, **kwargs)
    logger.success(
        f"Cec-base-Admin dispatch one admin instance success. "
        f"proto={cec_url.proto}, url={url}")
    return admin_instance


class TopicAlreadyExistsException(CecException):
    """在创建 Topic 的过程中，如果当前 Topic 已经存在，则应当抛出本异常"""
    pass


class TopicNotExistsException(CecException):
    """在删除 Topic 的过程中，如果不存在目标 Topic，则应当抛出本异常"""
    pass


class ConsumerGroupAlreadyExistsException(CecException):
    """在创建消费组的过程中，如果当前消费组已经存在，则应当抛出本异常"""
    pass


class ConsumerGroupNotExistsException(CecException):
    """在删除消费组的过程中，如果不存在目标消费组，则应当抛出本异常"""
    pass
