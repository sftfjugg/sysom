# -*- coding: utf-8 -*- #
"""
Time                2022/8/31 23:38
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                common.py
Description:
"""

from redis import Redis
from ..cec_base.url import CecUrl


class StaticConst:
    CEC_REDIS_PREFIX = "CEC-REDIS:"

    REDIS_CEC_EVENT_VALUE_KEY = "redis-cec-event-value-key"
    _REDIS_ADMIN_META_PREFIX = f"{CEC_REDIS_PREFIX}META:"

    # 指示一个集合 => 保存了所有的 Stream 的key
    REDIS_ADMIN_TOPIC_LIST_SET = f"{_REDIS_ADMIN_META_PREFIX}" \
                                 f"TOPIC-LIST-SET"

    # 指示一个集合 => 保存了所有的 Consumer Group 的key
    REDIS_ADMIN_CONSUMER_GROUP_LIST_SET \
        = f"{_REDIS_ADMIN_META_PREFIX}" \
          f"CONSUMER-GROUP-LIST-SET"

    # 消费组订阅列表前缀 => 消费组的订阅列表里面存储了该消费组订阅的所有主题
    REDIS_ADMIN_CONSUMER_GROUP_SUB_LIST_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}" \
          f"SUB-LIST-PREFIX:"

    # 指定一个所有的 STREAM key 共用的前缀，方便获取 stream 列表
    REDIS_ADMIN_STREAM_KEY_PREFIX \
        = f"{CEC_REDIS_PREFIX}" \
          f"STREAM-PREFIX:"

    # 主题元数据信息前缀
    REDIS_ADMIN_TOPIC_META_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-META:"

    # 主题—消费组元数据信息前缀
    REDIS_ADMIN_TOPIC_CONSUMER_GROUP_META_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-CONSUMER-GROUP-META:"

    # 主题-消费者元数据 key
    TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID \
        = f"LAST-ACK-ID"

    # 主题锁前缀
    REDIS_ADMIN_TOPIC_LOCKER_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-LOCKER:"

    # 消费组锁前缀
    REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}CONSUMER-GROUP-LOCKER:"

    # 特化参数列表：
    REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN = 'cec_default_max_len'
    REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC = 'cec_auto_mk_topic'
    REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME = 'cec_pending_expire_time'

    _redis_special_parameter_list = [
        # cec_default_max_len => 默认最大队列长度限制
        #   1. 有效范围：Producer
        #   2. 含义：该参数指定了 Producer 将事件投递到某个具体的 Stream 中，期望该 Stream
        #           最大保持的队列长度，由于 Redis stream 底层使用树形结构，精确裁剪会很影响
        #           性能，所以该参数限制的是一个大致长度，实际队列可能会稍大于该值
        REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN,
        # cec_auto_mk_topic => 自动创建主题
        #   1. 有效范围：Consumer
        #   2. 含义：该参数指定了 Producer 在投递消息到某个 Topic 时，如果 Topic 不存在
        #           是否需要自动创建 Topic。
        REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC,
        # cec_pending_expire_time =>超期转换时间间隔
        #   1. 有效范围：Consumer
        #   2. 含义：该参数指定了一个事件再待确认列表（pending list）中长时间未确认被自动流
        #           转到组内其它消费者的的时间间隔，每个消费者在每批次消费时都会尝试将 pending
        #           list 中的超期事件流转给自己。
        REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME,
    ]
    _redis_special_parameters_default_value = {
        REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN: (int, 1000),
        REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC: (bool, False),
        REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME: (int, 5 * 60 * 1000)
    }

    @staticmethod
    def parse_special_parameter(params: dict) -> dict:
        """
        解析特化参数，并将特化参数从参数列表中移除
        Args:
            params:

        Returns:

        """
        res = {}
        for key in StaticConst._redis_special_parameter_list:
            _type, default = \
                StaticConst._redis_special_parameters_default_value[key]
            res[key] = _type(params.pop(key, default))
        return res

    @staticmethod
    def get_inner_topic_name(topic_name) -> str:
        """Get inner topic name by topic name

        通过 topic_name 获取对应的 inner_topic_name
        1. 事件主题在 Redis 中对应一个 STREAM；
        2. 本模块为所有由 cec-redis 创建的 STREAM 添加一个公共前缀作为命名空间；
        3. inner_topic_name = ALI-CEC-REDIS-STREAM-PREFIX:{topic_name}

        Args:
            topic_name: 主题名称

        Returns:
        """
        return f"{StaticConst.REDIS_ADMIN_STREAM_KEY_PREFIX}{topic_name}"

    @staticmethod
    def get_topic_name_by_inner_topic_name(inner_topic_name: str) -> str:
        """
        将 inner_topic_name => topic_name
        Args:
            inner_topic_name:

        Returns:

        """
        return inner_topic_name[
               len(StaticConst.REDIS_ADMIN_STREAM_KEY_PREFIX):]


class ClientBase:
    """
    cec 客户端基类，Redis* 需要集成本类，本类提供一些通用的实现
    """

    def __init__(self, url: CecUrl):
        self._redis_version = None
        self._special_params = StaticConst.parse_special_parameter(url.params)

    def get_special_param(self, key: str, default=''):
        return self._special_params.get(key, default)

    def is_gte_6_2(self, redis_client: Redis):
        """
        判断redis版本是否 >= 6.2
        Returns:

        """
        if not self._redis_version:
            self._redis_version = redis_client.info('server')['redis_version']
        return self._redis_version >= '6.2'

    def is_gte_7(self, redis_client: Redis):
        """
        判断redis版本是否 >= 7
        Args:
            redis_client:

        Returns:

        """
        if not self._redis_version:
            self._redis_version = redis_client.info('server')['redis_version']
        return self._redis_version >= '7'
