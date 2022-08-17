# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/25
Description:
"""
import importlib
from abc import ABCMeta, abstractmethod
from typing import Callable
from .base import Connectable, Disconnectable
from .base import Registrable
from .base import ProtoAlreadyExistsException, ProtoNotExistsException
from .url import CecUrl
from .event import Event
from loguru import logger


class Producer(Connectable, Disconnectable, Registrable,
               metaclass=ABCMeta):
    """Common Event Center Producer interface definition

    通用事件中心，生产者接口定义

    """
    protoDict = {}

    @abstractmethod
    def produce(self, topic_name: str, message_value: dict,
                auto_mk_topic: bool = False,
                callback: Callable[[Exception, Event], None] = None,
                **kwargs):
        """Generate one new event, then put it to event center

        生成一个新的事件，并将其注入到事件中心当中（本操作默认是异步的，如果想实现同步，
        请搭配 flush 方法使用）

        Args:
            topic_name: 主题名称
            message_value: 事件内容
            auto_mk_topic: 是否在主题不存在的时候自动创建
            callback(Callable[[Exception, Event], None]): 事件成功投递到事件中心回调

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
        """
        pass

    @abstractmethod
    def flush(self):
        """Flush all cached event to event center

        将在缓存中还未提交的所有事件都注入到事件中心当中（这是一个阻塞调用）

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
            >>> producer.flush()
        """
        pass

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        注册一个新的协议 => 一个新的执行模块的 Producer 实现要生效，需要调用本方法注册（通常执行
        模块按规范编写的话，是不需要开发者手动调用本方法的，抽象层会动态导入）

        Args:
            proto: 协议标识
            sub_class: 子类

        Returns:

        Examples:
            >>> Producer.register('redis', RedisProducer)

        """
        if proto in Producer.protoDict:
            err = ProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Producer."
            )
            logger.error(err)
            raise err
        Producer.protoDict[proto] = sub_class
        logger.success(f"Cec-base-Producer register proto '{proto}' success")


def dispatch_producer(url: str, **kwargs) -> Producer:
    """Construct one Producer instance according the url

    根据传入的 URL，构造对应的 Producer 实例

    Args:
        url(str): CecUrl

    Returns:
        Producer: one Producer instance

    Examples:
        >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
    """
    cec_url = CecUrl.parse(url)
    if cec_url.proto not in Producer.protoDict:
        # 检查是否可以动态导入包
        target_module = f"sdk.cec_{cec_url.proto}.{cec_url.proto}_producer"
        try:
            module = importlib.import_module(target_module)
            Producer.protoDict[cec_url.proto] = \
                getattr(module, f'{cec_url.proto.capitalize()}Producer')
        except ModuleNotFoundError:
            logger.error(
                f"Try to auto import module {target_module} failed.")
            err = ProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Producer."
            )
            raise err
    producer_instance = Producer.protoDict[cec_url.proto](
        cec_url,
        **kwargs
    )
    logger.success(
        f"Cec-base-Producer dispatch one producer instance success. "
        f"proto={cec_url.proto}, url={url}")
    return producer_instance
