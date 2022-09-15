# -*- coding: utf-8 -*- #
"""
Time                2022/8/31 17:24
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                consume_status_storage.py
Description:
"""

from redis import Redis
from redis.client import Pipeline
from ..cec_base.event import Event
from .common import StaticConst
from typing import Union


class ConsumeStatusStorage:
    """A consumer group consume status storage

    一个存储消费组消费状态的存储器
    1. 设计该存储器主要是为了计算 LAG（消息堆积数）；
    2. Redis 7.0 支持使用 xinfo group 得到：
        - 'lag' => stream 中任然等待被交付给指定消费组中消费者的消息数量（包括已交付未确认的）
        - 'pending' => stream 中已经交付给指定消费组中消费者但是未确认的消息数量
        - 'lag' + 'pending' => 即可得到主题中还未被消费者消费或者确认的消息数
    3. Redis 版本 < 7 没有办法获取上述数据，因此需要使用本类来兼容实现

    兼容的思路如下：
    1. 使用 Redis 提供的 zsets（有序列表）数据结构，为每个<topic, group>维护一个 zsets
       将 ID 转换成分数存储；
    2. 每次 RedisConsumer 使用 consume 获取消息时，调用 xinfo stream 获得：
        - 'length' => 队列当前的长度
        - 'fist-entry' => 取出队列中最早的消息的 ID
    3. 然后调用 ZREMRANGEBYSCORE 删除掉所有比最早的消息 ID 还小的消息；（防止过度堆积）
    4. 每个消息 ACK 的时候，将对应的 ID 插入到对应的 zsets 当中；

    5. 接着本类将提供下列静态方法：
        - get_lag(topic, group) => 得到主题的 LAG 值
    """

    _CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX = \
        f"{StaticConst.CEC_REDIS_PREFIX}CONSUME_STATUS_STORAGE:"

    max_float = float("inf")  # 无限大 比所有数大
    min_float = float("-inf")  # 无限小 比所有数小

    def __init__(self, _redis_client: Redis, stream: str, group_id: str):
        self._redis_client = _redis_client
        # 得到 Redis 服务器的版本号
        self._version = self._redis_client.info('server')['redis_version']
        # 判断是 Redis 版本是否大于 7
        self._is_gt_version_7 = self._version >= '7'
        self.stream = stream
        self.inner_stream_key = StaticConst.get_inner_topic_name(stream)
        self.group_id = group_id

    def update(self):
        """
        使用 xinfo stream 得到 stream 里面最早的消息的 ID，并据此删除对应 zsets 中的数据
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
        在某个消息被 ACK 后，执行本方法，将其 ID 存储到 zset 当中
        Args:
            pipeline:
            event:

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

    @staticmethod
    def get_already_ack_count(redis_client: Union[Redis, Pipeline],
                              stream: str,
                              group_id: str, ):
        """
        得到指定 <stream, group> 目前已经确认的消息数量，可以用来计算 LAG
        Args:
            redis_client:
            stream:
            group_id:

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
        删除 <stream, group> 对应的 zset => 通常在某个消费组离开 stream 时调用
        Args:
            redis_or_pl:
            stream:
            group_id:

        Returns:

        """
        return redis_or_pl.delete(
            ConsumeStatusStorage._get_z_set_key(stream, group_id))

    @staticmethod
    def destroy_by_stream(redis_client: Redis, stream: str):
        """
        删除 <stream, *> 对应的所有 zset => 通常在某个 stream 被删除时调用
        Args:
            redis_or_pl:
            stream:

        Returns:

        """
        keys = redis_client.keys(
            f"{ConsumeStatusStorage._CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX}" \
            f"{stream}:*")
        if len(keys) > 0:
            return redis_client.delete(*keys)
        return 0

    @staticmethod
    def _get_score_by_id(message_id: str):
        """
        根据 Redis 自动生成的 ID 转换成浮点数：'1526985054069-0' => 1526985054069.0

        Args:
            message_id:

        Returns:

        """
        return float(message_id.replace('-', '.'))

    @staticmethod
    def _get_z_set_key(stream: str, group_id: str):
        """
        获取对应 <stream, group> 用于存储 ID 的 zset 的 key
        Args:
            stream:
            group_id:

        Returns:

        """
        return \
            f"{ConsumeStatusStorage._CEC_REDIS_CONSUME_STATUS_STORAGE_PREFIX}" \
            f"{stream}:{group_id}"
