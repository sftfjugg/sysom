# -*- coding: utf-8 -*- #
"""
Time                2022/9/26 21:13
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                admin_static.py
Description:
"""
import sys
from typing import Optional, List
from itertools import chain
from redis import Redis
from loguru import logger
import redis.exceptions
from cec_base.exceptions import TopicNotExistsException, \
    TopicAlreadyExistsException, ConsumerGroupNotExistsException, \
    ConsumerGroupAlreadyExistsException
from cec_base.meta import TopicMeta, PartitionMeta, ConsumerGroupMeta, \
    ConsumerGroupMemberMeta
from cec_base.exceptions import CecException
from cec_base.log import LoggerHelper
from .utils import raise_if_not_ignore
from .consume_status_storage import ConsumeStatusStorage
from .common import StaticConst


####################################################################
# Static function implementation of the management interface
####################################################################

@logger.catch(reraise=True)
def static_create_topic(redis_client, topic_name: str = "",
                        num_partitions: int = 1,
                        replication_factor: int = 1, **kwargs) -> bool:
    """A static method to create one topic

    Args:
        redis_client(Redis): Redis client
        topic_name(str): Topic name
        num_partitions(int): Number of partitions
        replication_factor(int):  Number of replications

    Keyword Args:
        ignore_exception(bool): Whether ignore exception
        expire_time(int): Event expire time

    Returns:
        bool: True if create successful else failed

    """
    ignore_exception = kwargs.get("ignore_exception", False)
    expire_time = kwargs.get("expire_time", 24 * 60 * 60 * 1000)
    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} try to create_topic <topic_name="
        f"{topic_name}, num_partitions={num_partitions}"
        f", replication_factor={replication_factor},"
        f" expire_time={expire_time}>.")

    # The Key of the Stream that internally characterizes Topic, spliced with
    # a special prefix as a namespace
    inner_topic_name = StaticConst.get_inner_topic_name(
        topic_name)
    result = True
    try:
        if not _lock_topic(redis_client, topic_name,
                           ignore_exception):
            return False
        # 1. Determine whether Topic exists
        if static_is_topic_exist(redis_client,
                                 topic_name):
            raise TopicAlreadyExistsException(
                f"Topic {topic_name} already "
                f"exists."
            )
        # 2. Use xadd to trigger stream creation
        event_id = redis_client.xadd(inner_topic_name, {
            "test": 1
        })

        pipeline = redis_client.pipeline()
        # 3. Delete the test event just added and empty the stream.
        pipeline.xdel(inner_topic_name, event_id)

        # 4. add the new Topic to the Topic collection (for easy access to
        # the list of all Topics)
        pipeline.sadd(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET,
                      inner_topic_name)
        pipeline.execute()
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    finally:
        _unlock_topic(redis_client, topic_name)

    LoggerHelper.get_lazy_logger().success(
        f"{redis_client} create_topic '{topic_name}' successfully.")
    return result


@logger.catch(reraise=True)
def static_del_topic(redis_client: Redis, topic_name: str, **kwargs) -> bool:
    """A static method to delete one topic

    Args:
        redis_client(Redis): Redis client
        topic_name(str): Topic name

    Keyword Args:
        ignore_exception(bool): Whether ignore exception

    Returns:
        bool: True if delete successful else failed

    """
    ignore_exception = kwargs.get("ignore_exception", False)
    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} try to del_topic <topic_name={topic_name}>.")

    inner_topic_name = StaticConst.get_inner_topic_name(
        topic_name)

    try:
        if not _lock_topic(redis_client, topic_name, ignore_exception):
            return False
        # 1. Determine whether topic exists.
        if not static_is_topic_exist(redis_client,
                                     topic_name):
            raise_if_not_ignore(ignore_exception,
                                TopicNotExistsException(
                                    f"Topic {topic_name} not exists."
                                ))
        pipeline = redis_client.pipeline()

        # 2. Delete the corresponding stream (topic)
        pipeline.delete(inner_topic_name)

        # 3. Remove the current topic from the topic list
        pipeline.srem(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET,
                      inner_topic_name)

        pipeline.execute()

        # 4. Clear topic-related metadata information
        del_topic_meta(redis_client, topic_name)

        # 5. Delete the structure associated with topic for storing consumption
        #    status
        ConsumeStatusStorage.destroy_by_stream(redis_client, topic_name)
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    except CecException as exc:
        raise_if_not_ignore(ignore_exception, exc)
    finally:
        _unlock_topic(redis_client, topic_name)

    LoggerHelper.get_lazy_logger().success(
        f"{redis_client} del_topic '{topic_name}' successfully.")
    return True


@logger.catch(reraise=True)
def static_is_topic_exist(redis_client: Redis, topic_name: str,
                          **kwargs) -> bool:
    """A static method to determine whether specific topic exists

    Args:
        redis_client(Redis): Redis client
        topic_name(str): Topic name
        **kwargs:

    Returns:

    """
    ignore_exception = kwargs.get("ignore_exception", False)
    res = False
    try:
        res = redis_client.type(
            StaticConst.get_inner_topic_name(topic_name)) == 'stream'
        LoggerHelper.get_lazy_logger().debug(
            f"Is topic {topic_name} exists? => {res}, {kwargs}.")
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    return res


@logger.catch(reraise=True)
def static_get_topic_list(redis_client: Redis, **kwargs) -> List[TopicMeta]:
    """A static method to get topic list

    Args:
        redis_client(Redis): Redis client

    Keyword Args:

    Returns:

    """
    ignore_exception = kwargs.get("ignore_exception", False)
    topics = []
    try:
        res = redis_client.smembers(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET)
        for inner_topic_name in res:
            topic_meta = TopicMeta(
                StaticConst.get_topic_name_by_inner_topic_name(
                    inner_topic_name))
            topic_meta.partitions = {
                0: PartitionMeta(0)
            }
            topics.append(topic_meta)
        LoggerHelper.get_lazy_logger().debug(
            f"get_topic_list => {res}.")
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    return topics


@logger.catch(reraise=True)
def static_create_consumer_group(redis_client: Redis,
                                 consumer_group_id: str,
                                 **kwargs) -> bool:
    """A static method to create a consumer group

    Args:
        redis_client(Redis): Redis client
        consumer_group_id(str): Consumer group ID

    Keyword Args:
        ignore_exception: Whether to ignore exceptions that may be thrown

    Returns:
        bool: True if successful, False otherwise.
    """
    ignore_exception = kwargs.get("ignore_exception", False)
    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} try to create_consumer_group "
        f"<consumer_group_id={consumer_group_id}>.")

    try:
        if not _lock_consumer_group(redis_client,
                                    consumer_group_id,
                                    ignore_exception):
            return False
        if static_is_consumer_group_exist(redis_client,
                                          consumer_group_id):
            if ignore_exception:
                return False
            raise ConsumerGroupAlreadyExistsException(
                f"Consumer group {consumer_group_id} already exists.")
        # Add to the consumer group key collection
        redis_client.sadd(
            StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
            consumer_group_id)
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    except CecException as exc:
        raise_if_not_ignore(ignore_exception, exc)
    finally:
        _unlock_consumer_group(redis_client,
                               consumer_group_id)
    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} create_consumer_group "
        f"'{consumer_group_id}' successfully.")
    return True


@logger.catch(reraise=True)
def static_del_consumer_group(redis_client: Redis,
                              consumer_group_id: str,
                              **kwargs) -> bool:
    """A static method to delete a consumer group

    Args:
        redis_client(Redis): Redis client
        consumer_group_id(str): Consumer group ID

    Keyword Args:
        ignore_exception: 是否忽略可能会抛出的异常

    Returns:

    """
    ignore_exception = kwargs.get("ignore_exception", False)
    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} try to del_consumer_group "
        f"<consumer_group_id={consumer_group_id}>.")

    try:
        if not _lock_consumer_group(
                redis_client, consumer_group_id, ignore_exception
        ):
            return False

        # 1. First determine if the consumer group exists, and if not, throw
        #    an exception as appropriate.
        if not static_is_consumer_group_exist(redis_client,
                                              consumer_group_id):
            raise_if_not_ignore(ignore_exception,
                                ConsumerGroupNotExistsException(
                                    f"Consumer group {consumer_group_id} "
                                    f"not exists."
                                ))

        # 2. Removal from the set of consumer groups.
        redis_client.srem(
            StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
            consumer_group_id)

        # 3. Destroy all consumer group structures of the same name in all
        #    streams associated with the current consumption group.
        streams = redis_client.lpop(
            get_sub_list_key(consumer_group_id),
            sys.maxsize
        )
        if streams is None:
            streams = []
        pipeline = redis_client.pipeline()
        for stream in streams:
            # Unsubscribe from topics
            pipeline.xgroup_destroy(stream, consumer_group_id)

            # Delete the corresponding zset
            ConsumeStatusStorage.destroy_by_stream_group(pipeline, stream,
                                                         consumer_group_id)
        pipeline.execute()
        for stream in streams:
            # Clear metadata information related to topic-consumer groups
            del_topic_consumer_group_meta(redis_client, stream,
                                          consumer_group_id)
    except ConsumerGroupNotExistsException as exc:
        raise_if_not_ignore(ignore_exception, exc)
    except redis.exceptions.RedisError:
        # Ignore errors that may be generated by Pipeline performing cleanup
        # operations here
        pass
    finally:
        _unlock_consumer_group(redis_client, consumer_group_id)

    LoggerHelper.get_lazy_logger().debug(
        f"{redis_client} del_consumer_group "
        f"'{consumer_group_id}' successfully.")
    return True


@logger.catch(reraise=True)
def static_is_consumer_group_exist(redis_client: Redis,
                                   consumer_group_id: str,
                                   **kwargs) -> bool:
    """A static method to determine whether the specific consumer group exists

    Args:
        redis_client(Redis): Redis client
        consumer_group_id(str): Consumer group ID

    Keyword Args:
        ignore_exception: Whether to ignore exceptions that may be thrown

    Returns:
        [ConsumerGroupMeta]: The consumer group list
    """
    ignore_exception = kwargs.get("ignore_exception", False)
    res = False
    try:
        res = redis_client.sismember(
            StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
            consumer_group_id)

        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} Is consumer group '{consumer_group_id}' "
            f"exists => {res}")
    except redis.exceptions.RedisError as exc:
        raise_if_not_ignore(ignore_exception, exc)
    return res


@logger.catch(reraise=True)
def static_get_consumer_group_list(redis_client: Redis, **kwargs) \
        -> List[ConsumerGroupMeta]:
    """A static method to get consumer group list

    Args:
        redis_client(Redis): Redis client

    Keyword Args:
        ignore_exception: Whether to ignore exceptions that may be thrown

    Returns:

    """
    ignore_exception = kwargs.get("ignore_exception", True)
    res = redis_client.smembers(
        StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET)
    group_metas = []
    for group_id in res:
        group_meta = ConsumerGroupMeta(group_id)
        try:
            # Get information about all subscribed topics for this consumer
            # group
            sub_topics = redis_client.lrange(
                get_sub_list_key(group_id), 0, -1
            )

            # Iterate through all topics to get all members
            pipeline = redis_client.pipeline(transaction=True)
            for topic in sub_topics:
                pipeline.xinfo_consumers(topic, group_id)

            # {"name":"Alice","pending":1,"idle":9104628}
            for consumer in chain.from_iterable(pipeline.execute()):
                group_meta.members.append(
                    ConsumerGroupMemberMeta(consumer['name']))
        except redis.exceptions.RedisError as exc:
            raise_if_not_ignore(ignore_exception, exc)
            group_meta.error = exc
        except CecException as exc:
            raise_if_not_ignore(ignore_exception, exc)
            group_meta.error = exc
        else:
            group_metas.append(group_meta)

    LoggerHelper.get_lazy_logger().debug(
        f"get_consumer_group_list => {res}.")
    return group_metas


def static_del_consumer(redis_client: Redis, topic: str, group: str,
                        consumer: str):
    """A static method to remove consumer from consumer group

    Args:
        redis_client(Redis):
        topic(str):
        group(str):
        consumer(str):

    Returns:

    """
    return redis_client.xgroup_delconsumer(topic, group, consumer) == 1


def _lock_consumer_group(redis_client: Redis, consumer_group_id: str,
                         ignore_exception: bool = False) -> bool:
    """Lock specific consumer group

    Lock a consumer group to prevent repeated operation problems in concurrent
    scenarios.

    Args:
        redis_client:
        consumer_group_id:
        ignore_exception:

    Returns:

    """
    if redis_client.set(
            f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
            f"{consumer_group_id}",
            consumer_group_id, nx=True, ex=10) == 0:
        return raise_if_not_ignore(ignore_exception,
                                   CecException(
                                       "Someone else is creating or"
                                       " deleting this consumer group."
                                   ))
    return True


def _unlock_consumer_group(redis_client: Redis,
                           consumer_group_id: str) -> bool:
    """Unlock specific consumer group

    Releasing a lock placed on a consumer group should be used in conjunction
    with lock_consumer_group

    Args:
        redis_client:
        consumer_group_id:

    Returns:

    """
    if redis_client.get(
            f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
            f"{consumer_group_id}"
    ) == consumer_group_id:
        return redis_client.delete(
            f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
            f"{consumer_group_id}") == 1
    return False


def _lock_topic(redis_client: Redis, topic: str,
                ignore_exception: bool = False) -> bool:
    """Lock specific topic

    Lock a topic to prevent repeated operation problems in concurrent scenes.

    Args:
        redis_client:
        topic:
        ignore_exception:

    Returns:

    """
    if redis_client.set(
            f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}",
            topic, nx=True, ex=10) == 0:
        return raise_if_not_ignore(ignore_exception,
                                   CecException(
                                       "Someone else is creating or deleting "
                                       "this topic."
                                   ))
    return True


def _unlock_topic(redis_client: Redis, topic: str) -> bool:
    """Unlock specific topic

    Releasing a lock placed on a topic should be used in conjunction with
    lock_topic

    Args:
        redis_client:
        topic:

    Returns:

    """
    # 释放锁
    if redis_client.get(
            f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}"
    ) == topic:
        return redis_client.delete(
            f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}") == 1
    return False


####################################################################
# 一些辅助函数
####################################################################

def get_topic_consumer_group_meta_info_key(
        topic: Optional[str], group_id: Optional[str], key: Optional[str]
):
    """Get topic-group meta info

    Get <topic, group> meta info key

    Args:
        topic:
        group_id:
        key:

    Returns:

    """
    return f"{StaticConst.REDIS_ADMIN_TOPIC_CONSUMER_GROUP_META_PREFIX}" \
           f"{topic + ':' if topic is not None else ''}" \
           f"{group_id + ':' if group_id is not None else ''}" \
           f"{key + ':' if key is not None else ''}"


def get_topic_meta_info_key(topic: str, key: Optional[str]):
    """Get topic meta info

    Get <topic> meta info key

    Args:
        topic:
        key:

    Returns:

    """
    return f"{StaticConst.REDIS_ADMIN_TOPIC_META_PREFIX}" \
           f"{topic + ':' if topic is not None else ''}" \
           f"{key + ':' if key is not None else ''}"


def get_sub_list_key(group_id: str) -> str:
    """Get sub list

    Get sub list key => Each topic is associated with a sub list containing the
    IDs of all consumer groups that are subscribed to the topic

    Args:
        group_id:

    Returns:

    """
    return f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_SUB_LIST_PREFIX}" \
           f"{group_id}"


def store_meta(redis_client: Redis, key: str, value: str):
    """Store meta info

    Store metadata

    Args:
        redis_client:
        key:
        value:

    Returns:

    """
    return redis_client.set(key, value)


def get_meta(redis_client: Redis, key: str):
    """Get meta info

    Get metadata

    Args:
        redis_client:
        key:

    Returns:

    """
    return redis_client.get(key)


def del_meta(redis_client: Redis, prefix: str):
    """Delete meta info

    Delete metadata

    Args:
        redis_client:
        prefix:

    Returns:

    """
    next_cursor = 0
    while True:
        next_cursor, key_list = redis_client.scan(
            next_cursor,
            match=f"{prefix}*",
            count=100
        )
        if len(key_list) > 0:
            redis_client.delete(*key_list)
        if next_cursor == 0:
            break
    return True


def store_topic_consumer_group_meta(redis_client: Redis, topic: str,
                                    key: str, group_id: str, value):
    """Store topic-group meta info

    Store <topic, group> metadata

    Args:
        redis_client:
        topic:
        key:
        group_id:
        value:

    Returns:

    """
    return store_meta(
        redis_client,
        get_topic_consumer_group_meta_info_key(
            topic, group_id, key
        ),
        value
    )


def store_topic_meta(redis_client: Redis, topic: str, key: str, value):
    """Store topic meta info

    Store <topic> metadata

    Args:
        redis_client:
        topic:
        key:
        value:

    Returns:

    """
    return store_meta(
        redis_client,
        get_topic_meta_info_key(topic, key),
        value
    )


def get_topic_consumer_group_meta(redis_client: Redis, topic: str,
                                  group_id: str, key: str):
    """Get topic-group meta info

    Get <topic, group> metadata

    Args:
        redis_client:
        topic:
        group_id:
        key:

    Returns:

    """
    return get_meta(
        redis_client,
        get_topic_consumer_group_meta_info_key(
            topic, group_id, key
        )
    )


def get_topic_meta(redis_client: Redis, topic: str, key: str):
    """Get topic meta info

    Get topic-related metadata information

    Args:
        redis_client:
        topic:
        key:

    Returns:

    """
    return get_meta(
        redis_client,
        get_topic_meta_info_key(topic, key)
    )


def del_topic_consumer_group_meta(redis_client: Redis,
                                  topic: str, group_id: str):
    """Delete topic-group meta info

    Delete <topic, group> metadata information

    Args:
        redis_client:
        topic:
        group_id:

    Returns:

    """
    return del_meta(
        redis_client,
        get_topic_consumer_group_meta_info_key(
            topic, group_id, None
        )
    )


def del_topic_meta(redis_client: Redis, topic: str):
    """Delete all meta info for specific topic

    Delete all metadata information for a specific topic

    Args:
        redis_client:
        topic:

    Returns:

    """
    res1 = del_meta(
        redis_client,
        get_topic_consumer_group_meta_info_key(topic, None, None)
    )
    res2 = del_meta(
        redis_client, get_topic_meta_info_key(topic, None)
    )
    return res1 and res2
