# -*- coding: utf-8 -*- #
"""
Time                2022/7/27 9:21
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                producer.py
Description:
"""
import importlib
from abc import ABCMeta, abstractmethod
from typing import Callable, Union
from .base import Connectable
from .exceptions import CecProtoAlreadyExistsException
from .exceptions import CecProtoNotExistsException
from .log import LoggerHelper
from .url import CecUrl
from .event import Event


class Producer(Connectable, metaclass=ABCMeta):
    """Common Event Center Producer interface definition

    This interface defines the generic behavior of the CEC Producer.

    """
    proto_dict = {}

    @abstractmethod
    def produce(self, topic_name: str, message_value: Union[bytes, dict],
                callback: Callable[[Exception, Event], None] = None, **kwargs):
        """Generate a new event, then put it to event center

        Generate a new event and inject it into the event center (this
        operation is asynchronous by default, if you want to be synchronous,
        use it with the flush method)

        Args:
            topic_name(str): Topic name
            message_value(bytes | dict): Event value
            callback(Callable[[Exception, Event], None]): Event delivery
                                                          results callback

        Keyword Args:
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

    @abstractmethod
    def flush(self, timeout: int = -1, **kwargs):
        """Flush all cached event to event center

        Deliver all events in the cache that have not yet been committed into
        the event center (this is a blocking call)

        Args:
            timeout(int): Blocking wait time
                          (Negative numbers represent infinite blocking wait)

        Examples:
            >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
            >>> producer.produce("test_topic", {"value": "hhh"})
            >>> producer.flush()
        """

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        Register a new protocol => This function is called by the executing
        module to register its own implementation of Producer for the executing
        module to take effect.
        (Usually when the execution module is implemented according to the
        specification, there is no need for the developer to call this method
        manually, the abstraction layer will dynamically import)

        Args:
            proto(str): Protocol identification
            sub_class: Implementation class of Producer

        Returns:

        Examples:
            >>> Producer.register('redis', RedisProducer)

        """
        if proto in Producer.proto_dict:
            err = CecProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Producer."
            )
            LoggerHelper.get_lazy_logger().error(err)
            raise err
        Producer.proto_dict[proto] = sub_class
        LoggerHelper.get_lazy_logger().success(
            f"Cec-base-Producer register proto '{proto}' success"
        )


def dispatch_producer(url: str, **kwargs) -> Producer:
    """Construct one Producer instance according the url

    Construct a Producer instance of the corresponding type based on the URL
    passed in.

    Args:
        url(str): CecUrl

    Returns:
        Producer: one Producer instance

    Examples:
        >>> producer = dispatch_producer(
            ..."redis://localhost:6379?password=123456")
    """
    cec_url = CecUrl.parse(url)
    if cec_url.proto not in Producer.proto_dict:
        # Check if dynamic import is possible
        target_module = f"cec_{cec_url.proto}.{cec_url.proto}_producer"
        try:
            module = importlib.import_module(target_module)
            Producer.register(
                cec_url.proto,
                getattr(module, f'{cec_url.proto.capitalize()}Producer')
            )
        except ModuleNotFoundError as exc:
            LoggerHelper.get_lazy_logger().error(
                f"Try to auto import module {target_module} failed."
            )
            raise CecProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Producer."
            ) from exc
    producer_instance = Producer.proto_dict[cec_url.proto](cec_url, **kwargs)
    LoggerHelper.get_lazy_logger().success(
        f"Cec-base-Producer dispatch one producer instance success. "
        f"proto={cec_url.proto}, url={url}"
    )
    return producer_instance
