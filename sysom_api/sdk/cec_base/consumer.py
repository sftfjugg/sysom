# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/24
Description:
"""
import importlib
import uuid
from abc import ABCMeta, abstractmethod
from enum import Enum
from .event import Event
from .base import Connectable, Disconnectable
from .base import Registrable
from .base import ProtoAlreadyExistsException, ProtoNotExistsException
from .url import CecUrl
from loguru import logger


class ConsumeMode(Enum):
    """Consume mode enum definition

    消费模式枚举值定义
    
    CONSUME_FROM_NOW：在指定的topic上，消费从连接上事件中心开始以后产生的事件（扇形广播模式）
    CONSUME_FROM_EARLIEST：在指定的topic上，从最早有记录的事件开始从头消费（扇形广播模式）
    CONSUME_GROUP：以组消费的模式进行消费，属于同一个消费组的所有的消费者共同消费一组事件（事件会在多个消费者之间进行负载均衡）
    """
    CONSUME_FROM_NOW = 1
    CONSUME_FROM_EARLIEST = 2
    CONSUME_GROUP = 3


class Consumer(Connectable, Disconnectable, Registrable, metaclass=ABCMeta):
    """Common Event Center Consumer interface definition

    通用事件中心，消费者接口定义

    Args:
        topic_name(str):  主题名字（主题的唯一标识）
        consumer_id(str): 消费者ID，唯一标识一个消费者
        group_id(str): 消费者ID，唯一标识一个消费组
        start_from_now(bool): 是否从最早的事件开始消费
        default_batch_consume_limit(int): 默认批量消费限制

    Attributes:
        topic_name(str):  主题名字（主题的唯一标识）
        consumer_id(str): 消费者ID，唯一标识一个消费者
        group_id(str): 消费者ID，唯一标识一个消费组
        default_batch_consume_limit(int): 默认批量消费限制
        consume_mode(ConsumeMode): 消费模式

    """
    protoDict = {

    }

    def __init__(self, topic_name: str, consumer_id: str = "",
                 group_id: str = "", start_from_now: bool = True,
                 default_batch_consume_limit: int = 10):
        self.topic_name = topic_name
        self.consumer_id = consumer_id
        self.default_batch_consume_limit = default_batch_consume_limit
        if consumer_id is None or consumer_id == "":
            self.consumer_id = Consumer.generate_consumer_id()
        self.group_id = group_id
        self.consume_mode = ConsumeMode.CONSUME_FROM_EARLIEST
        if group_id is not None and group_id != "":
            self.consume_mode = ConsumeMode.CONSUME_GROUP
        elif start_from_now:
            self.consume_mode = ConsumeMode.CONSUME_FROM_NOW

    @abstractmethod
    def consume(self, timeout: int = 0, auto_ack: bool = False,
                batch_consume_limit: int = 0) -> [Event]:
        """Start to consume the event from event center according to the
        corresponding ConsumeMode

        根据对应消费模式的行为，开始从事件中心消费事件

        Args:
            timeout(int): 超时等待时间（单位：ms），0 表示阻塞等待
            auto_ack(bool): 是否开启自动确认（组消费模式有效）

                1. 一旦开启自动确认，每成功读取到一个事件消息就会自动确认；
                2. 调用者一定要保证消息接收后正常处理，因为一旦某个消息被确认，消息中心不保证下次
                   仍然可以获取到该消息，如果客户端在处理消息的过程中奔溃，则该消息或许无法恢复；
                3. 所以最保险的做法是，auto_ack = False 不开启自动确认，在事件被正确处理完
                   后显示调用 Consumer.ack() 方法确认消息被成功处理;
                4. 如果有一些使用组消费业务，可以承担事件丢失无法恢（只会在客户端程序奔溃没有正确
                   处理的情况下才会发生）的风险，则可以开启 auto_ack 选项。

            batch_consume_limit(int): 批量消费限制

                1. 该参数指定了调用 consume 方法，最多一次拉取的事件的数量；
                2. 如果该值 <= 0 则将采用 self.default_batch_consume_limit 中指定的缺省
                   值；
                3. 如果该值 > 0 则将覆盖 self.default_batch_consume_limit，以本值为准。

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
        pass

    @abstractmethod
    def ack(self, event_id: str) -> int:
        """Confirm that the specified event has been successfully consumed

        对指定的事件进行消费确认
        1. 通常应当在取出事件，并成功处理之后对该事件进行确认；

        Args:
            event_id: 事件ID

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
            >>> consumer.ack(msg.event_id)
        """
        pass

    # @abstractmethod
    # def convert_to_broadcast_consume_mode(self):
    #     """Change consume mode to broadcast mode
    #
    #     从组消费模式切换到广播消费模式
    #     1. 如果当前已经处于广播消费模式，则本函数什么也不做
    #     2. 如果当前处于组消费模式，将切换到广播消费模式，并且：
    #         a. 如果当前已经在组消费模式下消费若干事件了，则接下来会消费当前主题最后一次消费的
    #            事件之后的所有事件；
    #         b. 如果当前在组消费模式下还没有消费任何事件，则只是简单的切换到广播消费，接下来会
    #            消费当前接入时间之后产生的事件；（不建议，还不如直接dispatch_consumer的时
    #            候就指定广播消费）
    #
    #     提供本接口的考虑：
    #     假设我们现在有一个场景：一个系统 S 由前端（S-Web）+后台（S-Server）组成，S-Server
    #     和S-Web之间使用Websocket通信建立了一套通知系统，S-Server会在某些事件产生时，将通知
    #     推送给特定的用户。并且当前系统允许多登陆，即可以在多个设备上登录同一个账号，那么当后台
    #     产生事件时，应该推送给哪个设备呢？
    #     => 解决方案：对于登录同一个账号并且同时在线的多个设备，认定第一个登录的为主设备，S-Server
    #     会将所有产生的通知（包括没有设备登录时累积的通知）
    #
    #     Returns:
    #
    #     """
    #     pass

    @abstractmethod
    def __getitem__(self, item):
        """ Require subclass to implement __getitem__ to support for-each

        要求客户端实现 __getitem__ 以支持使用for循环直接遍历事件

        :param item:
        :return:
        """
        pass

    @staticmethod
    def generate_consumer_id() -> str:
        """Generate one random consumer ID

        随机生成一个消费者ID

        Returns:
            str: The generated consumer ID

        Examples:
            >>> Consumer.generate_consumer_id()
            UUID('30e2fda7-d4b2-48b0-9338-78ff389648e7')
        """
        return str(uuid.uuid4())

    @staticmethod
    def register(proto, sub_class):
        """Register one new protocol => indicate one execution module

        注册一个新的协议 => 一个新的执行模块的 Consumer 实现要生效，需要调用本方法注册（通常执行
        模块按规范编写的话，是不需要开发者手动调用本方法的，抽象层会动态导入）

        Args:
            proto: 协议标识
            sub_class: 子类

        Returns:

        Examples:
            >>> Consumer.register('redis', RedisConsumer)

        """
        if proto in Consumer.protoDict:
            err = ProtoAlreadyExistsException(
                f"Proto '{proto}' already exists in Cec-base-Consumer."
            )
            logger.error(err)
            raise err
        Consumer.protoDict[proto] = sub_class
        logger.success(f"Cec-base-Consumer register proto '{proto}' success")


def dispatch_consumer(url: str, topic_name: str, consumer_id: str = "",
                      group_id: str = "", start_from_now: bool = True,
                      default_batch_consume_limit: int = 10,
                      **kwargs) -> Consumer:
    """Construct one Consumer instance according the url

    根据传入的 URL，构造对应类型的 Consumer 实例

    Args:
        url: CecUrl
        topic_name: 主题名字（主题的唯一标识）
        consumer_id: 消费者ID，唯一标识一个消费者

            1. 如果是组消费模式，唯一标识一个消费组中的消费者;
            2. consumer_id 建议使用 Consumer.generate_consumer_id() 方法生成；
            3. 如果没有指定 consumer_id，则内部会使用 Consumer.generate_consumer_id()
               自动填充该字段。

        group_id: 消费者ID，唯一标识一个消费组

            1. 如果不传递该字段，则默认采用广播消费模式（可以搭配 start_from_now 指定从什
               么位置开始消费事件）；
            2. 如果传递了 group_id，则开启组消费模式。

        start_from_now: 是否从最早的事件开始消费

            1. 如果 group_id 字段已指定，则本字段会直接忽略（因为本字段在组消费模式下无效）；
            2. 否则，start_from_now == True 表示从该Topic的最早的有记录的事件开始消费。

        default_batch_consume_limit: 默认批量消费限制

            1. 该参数指定了默认情况下，调用 consume 方法，最多一次拉取的事件的数量；
            2. 由于客户端每次从事件中心拉取消息都会经历一次往返延迟，在网络延迟较大的时，如
               果每次只能拉取一个消息，会极大的限制消费速率（message per second），因此
               在网络延迟较大的情况下，可以适当增大每次批量拉取消息的上限；
            3. 本参数指定的是缺省情况下的默认值，可以在调用 consume 方法的时候，传递
               'batch_consume_limit' 参数覆盖该值。

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
    if cec_url.proto not in Consumer.protoDict:
        # 检查是否可以动态导入包
        target_module = f"sdk.cec_{cec_url.proto}.{cec_url.proto}_consumer"
        try:
            module = importlib.import_module(target_module)
            Consumer.protoDict[cec_url.proto] = \
                getattr(module, f'{cec_url.proto.capitalize()}Consumer')
        except ModuleNotFoundError:
            logger.error(
                f"Try to auto import module {target_module} failed.")
            err = ProtoNotExistsException(
                f"Proto '{cec_url.proto}' not exists in Cec-base-Consumer."
            )
            raise err
    consumer_instance = Consumer.protoDict[cec_url.proto](
        cec_url,
        topic_name,
        consumer_id,
        group_id,
        start_from_now,
        default_batch_consume_limit,
        **kwargs
    )
    logger.success(
        f"Cec-base-Consumer dispatch one consumer instance success. "
        f"proto={cec_url.proto}, url={url}")
    return consumer_instance
