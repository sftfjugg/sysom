# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/24
Description:
"""
import importlib
from abc import ABCMeta, abstractmethod
from .base import Connectable, Disconnectable
from .base import Registrable, ProtoAlreadyExistsException
from .base import ProtoNotExistsException
from .url import CecUrl
from loguru import logger


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
    def get_topic_list(self) -> [str]:
        """Get topic list

        获取主题列表

        Args:

        Returns:
            [str]: The topic name list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_topic_list()
            ['test_topic']
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
    def get_consumer_group_list(self) -> [str]:
        """Get consumer group list

        获取消费组列表

        Returns:
            [str]: The consumer group list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consumer_group_list()
            ['test_group']
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


class TopicAlreadyExistsException(Exception):
    """在创建 Topic 的过程中，如果当前 Topic 已经存在，则应当抛出本异常"""
    pass


class TopicNotExistsException(Exception):
    """在删除 Topic 的过程中，如果不存在目标 Topic，则应当抛出本异常"""
    pass


class ConsumerGroupAlreadyExistsException(Exception):
    """在创建消费组的过程中，如果当前消费组已经存在，则应当抛出本异常"""
    pass


class ConsumerGroupNotExistsException(Exception):
    """在删除消费组的过程中，如果不存在目标消费组，则应当抛出本异常"""
    pass
