# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/24
Description:
"""
from abc import ABCMeta, abstractmethod
from loguru import logger


class Connectable(metaclass=ABCMeta):
    """可连接对象接口，定义了一个可以连接到远端服务的客户端对象的通用行为"""

    @abstractmethod
    def connect(self, url: str):
        """Connect to remote server by url

        通过一个 URL 连接到远端的服务，不限制 URL 的格式，可以自行约定

        Args:
          url:

        Returns:

        """
        pass


class ConnectException(Exception):
    """连接过程中发生任何错误都会抛出本异常"""
    pass


class Disconnectable(metaclass=ABCMeta):
    """可断开连接对象接口，定义了一个可以主动断开远程连接的客户端对象的通用行为"""

    @abstractmethod
    def disconnect(self):
        pass


class Registrable(metaclass=ABCMeta):
    """可注册对象接口，定义了一个可以注册扩展的类的通用行为"""

    @staticmethod
    @abstractmethod
    def register(proto, instance):
        pass


class Dispatchable(metaclass=ABCMeta):
    """可分发对象接口，定义了一个可以通过统一的分发接口产生不同类型实例的对象的通用行为"""

    @staticmethod
    @abstractmethod
    def dispatch(url: str, *args, **kwargs):
        pass


class ProtoAlreadyExistsException(Exception):
    """协议已经存在异常

    1. 在注册一个新的协议时，该协议名已经被注册，则会抛出本异常
    """
    pass


class ProtoNotExistsException(Exception):
    """协议不存在异常

    1. 使用URL分发方式创建实例时，如果对应的协议并没有被注册，则会抛出本异常
    """
    pass


def raise_if_not_ignore(is_ignore_exception: bool, exception: Exception):
    """工具函数，根据配置选择是否抛出异常

    Args:
      is_ignore_exception: Is ignore exception while `exception` be raised.
      exception: The exception want to check
    """
    if is_ignore_exception:
        # 选择忽略异常，则在日志中采用 exception 的方式记录该忽略的异常
        logger.exception(exception)
        return False
    else:
        raise exception
