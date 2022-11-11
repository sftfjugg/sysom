# -*- coding: utf-8 -*- #
"""
Time                2022/8/3 17:24
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                consume_status_storage.py
Description:
"""

from typing import Union
from redis import Redis
from redis.client import Pipeline
from cec_base.event import Event
from .common import StaticConst


class ConsumeStatusStorage:
    """A consumer group consume status storage

    A storage to store the consumption status of the consumption group

    1. This class is designed primarily to calculate the LAG;
    2. Redis 7.0 supports using the xinfo group to get LAG:
        - 'lag' => Number of messages in stream that are still waiting to be
                   delivered to consumers in the specified consumer group
                   (including delivered unacknowledged ones);
        - 'pending' => The number of messages in stream that have been
                       delivered to consumers in the specified consumer group
                       but not acknowledged;
        - 'lag' + 'pending' => That gives the number of messages in the topic
                               that have not yet been consumed or confirmed by
                               the consumer.
    3. Redis version < 7 does not have a way to fetch the above data, so you
       need to use this class for a compatible implementation

    The idea of compatibility is as follows.
    1. Maintain a zsets for each <topic, group> to store IDs as scores using
       the zsets (ordered list) data structure provided by Redis.
    2. Each time a RedisConsumer uses consume to get a message, call xinfo
       stream to get:
        - 'length' => Current length of the queue
        - 'fist-entry' => Fetch the ID of the earliest message in the queue
    3. Then call ZREMRANGEBYSCORE to remove all messages smaller than the
       earliest message ID; (to prevent excessive stacking)
    4. When each message is acknowledged, the corresponding ID is inserted into
       the corresponding zsets;
    5. Then this class will provide the following static methods:
        - get_lag(topic, group) => Get the LAG value of the subject
    """

    _CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX = \
        f"{StaticConst.CEC_REDIS_PREFIX}CONSUME_STATUS_STORAGE:"

    max_float = float("inf")  # Infinity. Bigger than all the numbers.
    min_float = float("-inf")  # Infinitely small. Smaller than all numbers

    def __init__(self, _redis_client: Redis, stream: str, group_id: str):
        self._redis_client = _redis_client
        # Get the version number of the Redis server
        self._version = self._redis_client.info('server')['redis_version']
        # Determine if the Redis version is greater than 7
        self._is_gt_version_7 = self._version >= '7'
        self.stream = stream
        self.inner_stream_key = StaticConst.get_inner_topic_name(stream)
        self.group_id = group_id

    def update(self):
        """Update inner zsets

        Use the xinfo stream to get the ID of the oldest message in the stream
        and delete the data in the corresponding zsets accordingly

        Returns:

        """
        if self._is_gt_version_7:
            return False
        stream_info = self._redis_client.xinfo_stream(self.inner_stream_key)
        if 'first-entry' in stream_info:
            min_id = stream_info['first-entry'][0]
            min_score = ConsumeStatusStorage._get_score_by_id(min_id)
            self._redis_client.zremrangebyscore(
                ConsumeStatusStorage._get_z_set_key(self.stream,
                                                    self.group_id),
                0,
                min_score - 1
            )
            return True
        return False

    def do_after_ack_by_pl(self, pipeline: Pipeline, event: Event):
        """

        After a message is acknowledged, execute this method to store its ID
        in zset

        Args:
            pipeline(Pipeline): Redis pipeline
            event(Event): CEC event

        References:
            https://redis.io/commands/zadd/

        Returns:

        """
        if self._is_gt_version_7:
            return False
        pipeline.zadd(
            ConsumeStatusStorage._get_z_set_key(self.stream,
                                                self.group_id),
            {
                event.event_id: ConsumeStatusStorage._get_score_by_id(
                    event.event_id)
            },
        )
        return True

    @staticmethod
    def get_already_ack_count(redis_client: Union[Redis, Pipeline],
                              stream: str,
                              group_id: str, ):
        """

        Gets the number of messages currently acknowledged for a given
        <stream, group>, which can be used to calculate the LAG

        Args:
            redis_client(Redis): Redis client
            stream(str): Topic / stream
            group_id(str): Consumer group ID

        References
            https://redis.io/commands/zcount/

        Returns:

        """
        return redis_client.zcount(
            ConsumeStatusStorage._get_z_set_key(stream, group_id),
            ConsumeStatusStorage.min_float,
            ConsumeStatusStorage.max_float
        )

    @staticmethod
    def destroy_by_stream_group(redis_or_pl: Union[Redis, Pipeline],
                                stream: str,
                                group_id: str):
        """

        Delete the zset => corresponding to <stream, group> usually called when
        a consumer group leaves the stream

        Args:
            redis_or_pl(Redis | Pipeline): Redis client or Redis pipeline
            stream(str): Topic / stream
            group_id(str): Consumer group ID

        Returns:

        """
        return redis_or_pl.delete(
            ConsumeStatusStorage._get_z_set_key(stream, group_id))

    @staticmethod
    def destroy_by_stream(redis_client: Redis, stream: str):
        """

        Delete all zset corresponding to <stream, *> => usually called when a
        stream is deleted

        Args:
            redis_client(Redis): Redis client
            stream(str): Topic / stream

        Returns:

        """
        keys = redis_client.keys(
            f"{ConsumeStatusStorage._CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX}"
            f"{stream}:*"
        )
        if len(keys) > 0:
            return redis_client.delete(*keys)
        return 0

    @staticmethod
    def _get_score_by_id(message_id: str):
        """

        Convert to floating point based on Redis auto-generated ID:
        '1526985054069-0' => 1526985054069.0

        Args:
            message_id:

        Returns:

        """
        return float(message_id.replace('-', '.'))

    @staticmethod
    def _get_z_set_key(stream: str, group_id: str):
        """

        Get the key of the zset corresponding to the <stream, group> used to
        store the ID

        Args:
            stream:
            group_id:

        Returns:

        """
        return \
            f"{ConsumeStatusStorage._CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX}" \
            f"{stream}:{group_id}"
