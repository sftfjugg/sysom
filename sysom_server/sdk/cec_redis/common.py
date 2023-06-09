# -*- coding: utf-8 -*- #
"""
Time                2022/7/29 13:33
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                common.py
Description:
"""

from redis import Redis
from cec_base.url import CecUrl


class StaticConst:
    """Static consts

    This class defines all the static constant values in the cec-redis module
    """
    CEC_REDIS_PREFIX = "CEC-REDIS:"

    REDIS_CEC_EVENT_VALUE_KEY = "redis-cec-event-value-key"
    REDIS_CEC_EVENT_VALUE_TYPE_KEY = "rcev-type-key"
    REDIS_CEC_EVENT_VALUE_TYPE_DICT = "DICT"
    REDIS_CEC_EVENT_VALUE_TYPE_BYTES = "BYTES"
    REDIS_CEC_EVENT_VALUE_TYPE_STRING = "STRING"
    _REDIS_ADMIN_META_PREFIX = f"{CEC_REDIS_PREFIX}META:"

    # Indicates a collection => holds the keys of all Streams
    REDIS_ADMIN_TOPIC_LIST_SET = f"{_REDIS_ADMIN_META_PREFIX}" \
                                 f"TOPIC-LIST-SET"

    # Indicates a collection => holds the keys of all Consumer Groups
    REDIS_ADMIN_CONSUMER_GROUP_LIST_SET \
        = f"{_REDIS_ADMIN_META_PREFIX}" \
          f"CONSUMER-GROUP-LIST-SET"

    # Consumer group subscription list prefix => The consumer group's
    # subscription list stores all topics to which the consumer group is
    # subscribed
    REDIS_ADMIN_CONSUMER_GROUP_SUB_LIST_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}" \
          f"SUB-LIST-PREFIX:"

    # Specify a prefix that is common to all STREAM keys to make it easier to
    # get the stream list
    REDIS_ADMIN_STREAM_KEY_PREFIX \
        = f"{CEC_REDIS_PREFIX}" \
          f"STREAM-PREFIX:"

    # Topic metadata information prefix
    REDIS_ADMIN_TOPIC_META_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-META:"

    # Topic-Consumer Group Metadata Information Prefix
    REDIS_ADMIN_TOPIC_CONSUMER_GROUP_META_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-CONSUMER-GROUP-META:"

    # Last ack ID key
    TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID \
        = "LAST-ACK-ID"

    # Topic lock prefix
    REDIS_ADMIN_TOPIC_LOCKER_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}TOPIC-LOCKER:"

    # Consumer group lock prefix
    REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX \
        = f"{_REDIS_ADMIN_META_PREFIX}CONSUMER-GROUP-LOCKER:"

    # Heartbeat monitoring related configurations
    REDIS_HEARTBEAT_CHANNEL_PREFIX = f"{CEC_REDIS_PREFIX}HEARTBEAT:"

    # Heartbeat locker prefix
    REDIS_HEARTBEAT_LOCKER_PREFIX \
        = f"{CEC_REDIS_PREFIX}HEARTBEAT-LOCKER:"

    # List of specialization parameters
    REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN = 'cec_default_max_len'
    REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC = 'cec_auto_mk_topic'
    REDIS_SPECIAL_PARM_CEC_ENABLE_PENDING_LIST_TRANSFER = \
        "cec_enable_pending_list_transfer"
    REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME = 'cec_pending_expire_time'
    REDIS_SPECIAL_PARM_CEC_ENABLE_HEART_BEAT = 'cec_enable_heartbeat'
    REDIS_SPECIAL_PARM_CEC_HEARTBEAT_INTERVAL = 'cec_heartbeat_interval'
    REDIS_SPECIAL_PARM_CEC_HEARTBEAT_CHECK_INTERVAL = \
        'cec_heartbeat_check_interval'

    _redis_special_parameter_list = [
        # cec_default_max_len => Default maximum queue length limit
        #   1. Effective range：[Producer]
        #   2. Meaning: This parameter specifies the maximum queue length that
        #               the Producer expects the Stream to hold when it
        #               delivers events to a specific Stream.
        REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN,
        # cec_auto_mk_topic => Automatic topic creation
        #   1. Effective range：[Consumer]
        #   2. Meaning: This parameter specifies whether the Producer needs to
        #      create a Topic automatically if it does not exist when it
        #      delivers a message to a Topic.
        REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC,
        # cec_enable_pending_list_transfer => Whether enable pending list
        # transfer
        #   1. Effective range: [Consumer]
        #   2. Meaning: This parameter specifies whether enable pending list
        #      transfer mechanisms, if enabled, the consumer will try to
        #      transfer long unacknowledged messages from the same group's
        #      pending list to itself for processing at each consumption.
        REDIS_SPECIAL_PARM_CEC_ENABLE_PENDING_LIST_TRANSFER,
        # cec_pending_expire_time => expire conversion interval
        #   0. Require enable 'cec_enable_pending_list_transfer'
        #   1. Effective range：[Consumer(broadcast mode)]
        #   2. Meaning: This parameter specifies the time interval after which
        #      an event in the pending list that has been unacknowledged for a
        #      long time will be automatically streamed to other consumers in
        #      the group, and each consumer will try to stream the overdue
        #      events in the pending list to itself at each batch.
        REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME,
        # cec_enable_heartbeat => Enable heartbeat mechanisms
        #   1. Effective range: [Consumer(group consume mode)]
        #   2. Meaning: This parameter specifies whether enable heartbeat
        #      mechanisms, if enabled, the current consumer periodically sends
        #      heartbeat data to the channel shared by the consumer group,
        #      subscribes to and monitors the health of other consumers in the
        #      group, and tries to transfer its unacknowledged messages to
        #      itself for processing when it detects an offline consumer.
        REDIS_SPECIAL_PARM_CEC_ENABLE_HEART_BEAT,
        # cec_heartbeat_interval => Automatic switching of inspection
        #                               intervals
        #   0. Require enable 'cec_enable_heartbeat'
        #   1. Effective range：[Consumer(group consume mode)]
        #   2. Meaning: This parameter specifies the heartbeat interval.
        REDIS_SPECIAL_PARM_CEC_HEARTBEAT_INTERVAL,
        # cec_heartbeat_check_interval => Heartbeat check interval
        #   0. Require enable 'cec_enable_heartbeat'
        #   1. Effective range：[Consumer(group consume mode)]
        #   2. Meaning: This parameter specifies the heartbeat checkout
        #      interval.
        REDIS_SPECIAL_PARM_CEC_HEARTBEAT_CHECK_INTERVAL,
    ]

    _redis_special_parameters_default_value = {
        REDIS_SPECIAL_PARM_CEC_DEFAULT_MAX_LEN: (int, 1000),
        REDIS_SPECIAL_PARM_CEC_AUTO_MK_TOPIC: (bool, False),
        REDIS_SPECIAL_PARM_CEC_ENABLE_PENDING_LIST_TRANSFER: (bool, False),
        REDIS_SPECIAL_PARM_CEC_PENDING_EXPIRE_TIME: (int, 5 * 60 * 1000),
        REDIS_SPECIAL_PARM_CEC_ENABLE_HEART_BEAT: (bool, True),
        REDIS_SPECIAL_PARM_CEC_HEARTBEAT_INTERVAL: (int, 5),
        REDIS_SPECIAL_PARM_CEC_HEARTBEAT_CHECK_INTERVAL: (int, 3)
    }

    @staticmethod
    def parse_special_parameter(params: dict) -> dict:
        """Parse specialization parameters

        Parse the specialization parameters and remove the specialization
        parameters from the parameter list

        Args:
            params(dict): CecUrl.params

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

        Get the corresponding inner_topic_name by topic_name
        1. event topic corresponds to a STREAM in Redis.；
        2. This module adds a common prefix as a namespace to all STREAMs
           created by cec-redis；
        3. inner_topic_name = ALI-CEC-REDIS-STREAM-PREFIX:{topic_name}

        Args:
            topic_name(str): Topic name

        Returns:
        """
        return f"{StaticConst.REDIS_ADMIN_STREAM_KEY_PREFIX}{topic_name}"

    @staticmethod
    def get_topic_name_by_inner_topic_name(inner_topic_name: str) -> str:
        """Get topic name by inner topic name

        inner_topic_name => topic_name

        Args:
            inner_topic_name(str): inner topic name

        Returns:

        """
        return inner_topic_name[
               len(StaticConst.REDIS_ADMIN_STREAM_KEY_PREFIX):]


class ClientBase:
    """
    cec-redis client base class, Redis* requires  inherit from this class,
    which provides some generic implementation
    """

    def __init__(self, url: CecUrl):
        self._redis_version = None
        self._special_params = StaticConst.parse_special_parameter(url.params)

    def get_special_param(self, key: str, default=''):
        """Get specialization parameter by key

        Args:
            key(str): specialization parameter key
            default(Any): default value if key not exists

        Returns:

        """
        return self._special_params.get(key, default)

    def is_gte_6_2(self, redis_client: Redis):
        """Determine if redis version >= 6.2

        Args:
            redis_client(Redis): Redis client

        Returns:

        """
        if not self._redis_version:
            self._redis_version = redis_client.info('server')['redis_version']
        return self._redis_version >= '6.2'

    def is_gte_7(self, redis_client: Redis):
        """Determine if redis version >= 7

        Args:
            redis_client(Redis): Redis client

        Returns:

        """
        if not self._redis_version:
            self._redis_version = redis_client.info('server')['redis_version']
        return self._redis_version >= '7'
