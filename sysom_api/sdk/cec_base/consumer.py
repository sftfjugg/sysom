# -*- coding: utf-8 -*- #
"""
Time                2022/7/29 10:21
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                consumer.py
Description:
"""
import importlib
import uuid
from abc import ABCMeta, abstractmethod
from enum import Enum
from typing import List
from .event import Event
from .base import Connectable
from .exceptions import CecProtoAlreadyExistsException, \
    CecProtoNotExistsException
from .log import LoggerHelper
from .url import CecUrl


class ConsumeMode(Enum):
    """Consume mode enum definition

    Consume mode enumeration value definition

    CONSUME_FROM_NOW: Consume of events generated from after the moment of
                      access(Fan Broadcast Mode)
    CONSUME_FROM_EARLIEST: Consume from the earliest events(Fan Broadcast Mode)
    CONSUME_GROUP: Consumption in a group consumption model, where all
                   consumers belonging to the same consumption group consume a
                   set of events together (events are load balanced across
                   multiple consumers)
    """
    CONSUME_FROM_NOW = 1
    CONSUME_FROM_EARLIEST = 2
    CONSUME_GROUP = 3


class Consumer(Connectable, metaclass=ABCMeta):
    """Common Event Center Consumer interface definition

    This interface defines the generic behavior of the CEC Consumer.

    Args:
        topic_name(str):  Topic name (unique identification of the subject)
        consumer_id(str): Consumer ID, which uniquely identifies a consumer
        group_id(str): Consumer ID, which uniquely identifies a consumer group
        start_from_now(bool): Does consumption begin with the earliest events

    Keyword Args:
        default_batch_consume_limit(int): Default batch consume limit
        auto_convert_to_dict(bool): Whether to automatically treat the event as
                                    json and convert it to dict

    Attributes:
        topic_name(str):  Topic name (unique identification of the subject)
        consumer_id(str): Consumer ID, which uniquely identifies a consumer
        group_id(str): Consumer ID, which uniquely identifies a consumer group
        start_from_now(bool): Does consumption begin with the earliest events
        default_batch_consume_limit(int): Default batch consume limit
        auto_convert_to_dict(bool): Whether to automatically treat the event as
                                    json and convert it to dict

    """
    proto_dict = {

    }

    def __init__(self, topic_name: str, consumer_id: str = "",
                 group_id: str = "", start_from_now: bool = True, **kwargs):
        self.topic_name = topic_name
        self.consumer_id = consumer_id
        self.default_batch_consume_limit = kwargs.get(
            "default_batch_consume_limit", 10
        )
        self.auto_convert_to_dict = kwargs.get("auto_convert_to_dict", True)
        if consumer_id is None or consumer_id == "":
            self.consumer_id = Consumer.generate_consumer_id()
        self.group_id = group_id
        self.consume_mode = ConsumeMode.CONSUME_FROM_EARLIEST
        if group_id is not None and group_id != "":
            self.consume_mode = ConsumeMode.CONSUME_GROUP
        elif start_from_now:
            self.consume_mode = ConsumeMode.CONSUME_FROM_NOW

    @abstractmethod
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

    @abstractmethod
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
            >>> msgs = consumer.consume(200, auto_ack=False)
            >>> msg = msgs[0]
            >>> consumer.ack(msg)
        """

    @abstractmethod
    def __getitem__(self, item):
        """Require subclass to implement __getitem__ to support for-each

        Args:
            item:

        Returns:

        """

    @staticmethod
    def generate_consumer_id() -> str:
        """Generate one random consumer ID

        Generate a random consumer ID

        Returns:
            str: The generated consumer ID

        Examples:
            >>> Consumer.generate_consumer_id()
            30e2fda7-d4b2-48b0-9338-78ff389648e7
        """
        return str(uuid.uuid4())

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        Register a new protocol => This function is called by the executing
        module to register its own implementation of Consumer for the executing
        module to take effect.
        (Usually when the execution module is implemented according to the
        specification, there is no need for the developer to call this method
        manually, the abstraction layer will dynamically import)

        Args:
            proto(str): Protocol identification
            sub_class: Implementation class of Consumer

        Returns:

        Examples:
            >>> Consumer.register('redis', RedisConsumer)

        """
        if proto in Consumer.proto_dict:
            err = CecProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Consumer."
            )
            LoggerHelper.get_lazy_logger().error(err)
            raise err
        Consumer.proto_dict[proto] = sub_class
        LoggerHelper.get_lazy_logger().success(
            f"Cec-base-Consumer register proto '{proto}' success"
        )


def dispatch_consumer(url: str, topic_name: str, consumer_id: str = "",
                      group_id: str = "", start_from_now: bool = True,
                      **kwargs) -> Consumer:
    """Construct one Consumer instance according the url

    Construct a Consumer instance of the corresponding type based on the URL
    passed in.

    Args:
        url(str): CecUrl
        topic_name: Topic name (unique identification of the topic)
        consumer_id: Consumer ID, which uniquely identifies a consumer

            1. consumer_id is recommended to be generated using the
               Consumer.generate_consumer_id() method;
            2. If consumer_id is not specified, the field is automatically
               populated internally using Consumer.generate_consumer_id().

        group_id: Consumer group ID, which uniquely identifies a consumer group

            1. If this field is not passed, the broadcast consumption mode is
               used by default (which can be paired with start_from_now to
               specify where to start consuming events from);
            2. If group_id is passed, group consumption mode is enabled.

        start_from_now: Does consumption begin with the earliest events

            1. If the group_id field is specified, this field is simply ignored
               (as this field is not valid in group consumption mode);
            2. Otherwise, start_from_now == True means that consumption starts
               from the earliest recorded event for that Topic.

    Keyword Args:
        default_batch_consume_limit: Default batch consume limit

            1. This parameter specifies the number of events that will be
               pulled at most once by calling the consume method by default;
            2. Since the client will experience a round-trip delay each time it
               pulls an event from the event center, if it can only pull one
               event at a time when the network latency is high, it will
               greatly limit the consumption rate (messages per second), so the
               upper limit of events per bulk pull can be appropriately
               increased in the case of high network latency;
            3. This parameter specifies the default value, which can be
               overridden by passing the 'batch_consume_limit' parameter to the
               consume method when it is called.

        auto_convert_to_dict: Whether to automatically treat the event as json
                              and convert it to dict
            1. CEC supports delivering bytes or dict when using Producer for
               message production;
            2. If the corresponding prodcuer chooses to deliver a dict, the
               consumer may set this parameter to 'True' to ensure that the
               message returned via Consumer.consume() is automatically json
               decoded to a dict.
            3. If the corresponding producer chooses to deliver bytes, the
               consumer must set this parameter to 'False', because the
               underlying event content is in bytes format and can not be
               automatically decoded to dict.

    Returns:
        Consumer: One Consumer instance

    Examples:
        >>> consumer = dispatch_consumer(
            ... "redis://localhost:6379?password=123456"
            ... , 'this_is_a_test_topic'
            ... , consumer_id=Consumer.generate_consumer_id()
            ... , start_from_now=False)
    """
    cec_url = CecUrl.parse(url)
    if cec_url.proto not in Consumer.proto_dict:
        # Check if dynamic import is possible
        target_module = f"sdk.cec_{cec_url.proto}.{cec_url.proto}_consumer"
        try:
            module = importlib.import_module(target_module)
            Consumer.register(
                cec_url.proto,
                getattr(module, f'{cec_url.proto.capitalize()}Consumer')
            )
        except ModuleNotFoundError as exc:
            LoggerHelper.get_lazy_logger().error(
                f"Try to auto import module {target_module} failed."
            )
            raise CecProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Consumer."
            ) from exc
    consumer_instance = Consumer.proto_dict[cec_url.proto](
        cec_url,
        topic_name=topic_name,
        consumer_id=consumer_id,
        group_id=group_id,
        start_from_now=start_from_now,
        **kwargs
    )
    LoggerHelper.get_lazy_logger().success(
        f"Cec-base-Consumer dispatch one consumer instance success. "
        f"proto={cec_url.proto}, url={url}"
    )
    return consumer_instance
