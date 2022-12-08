# -*- coding: utf-8 -*- #
"""
Time                2022/7/29 11:28
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                utils.py
Description:
"""
import threading
from redis import Redis
import redis
from cec_base.url import CecUrl
from cec_base.exceptions import CecConnectionException
from cec_base.log import LoggerHelper


def do_connect(url: str) -> Redis:
    """Connect to remote redis by url

    Args:
        url(str): CecUrl format url

    Returns:

    """
    cec_url = CecUrl.parse(url)
    return do_connect_by_cec_url(cec_url)


def do_connect_by_cec_url(cec_url: CecUrl) -> Redis:
    """Connect to remote redis by CecUrl

    Args:
        cec_url(CecUrl):

    Returns:

    """
    host_port = cec_url.netloc.split(":")
    if len(host_port) != 2:
        raise CecConnectionException(
            f"Not valid host:port => {host_port[0]}:{host_port[1]}")
    host, port = host_port[0], int(host_port[1])
    try:
        redis_client = Redis(host=host, port=port, db=0, decode_responses=True,
                             **cec_url.params)
    except redis.ConnectionError as exc:
        raise CecConnectionException(exc) from exc
    return redis_client


def raise_if_not_ignore(is_ignore_exception: bool, exception: Exception):
    """Raise or ignore for specific exception

    Args:
      is_ignore_exception: Is ignore exception while `exception` be raised.
      exception: The exception want to check
    """
    if is_ignore_exception:
        # If you choose to ignore the exception, the ignored exception is
        # logged in the log as an exception
        LoggerHelper.get_lazy_logger().exception(exception)
        return False
    raise exception


class RedisLocker:
    """
    This is a simple redis lock implement

    Args:
        redis_client(Redis): Redis client
        key(str): Locker key
        ex(int): Expire time, seconds
    """

    def __init__(self, redis_client: Redis, key: str, ex: int = 10):
        self._redis_client = redis_client
        self._key = key
        self._ex = ex
        self._get_locker = False

    def __enter__(self):
        return self.lock()

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self.unlock()

    def unlock(self):
        """Unlock

        Returns:

        """
        if self._get_locker and self._redis_client.get(self._key) == self._key:
            return self._redis_client.delete(self._key) == 1
        return False

    def lock(self) -> bool:
        """Lock

        Returns:

        """
        self._get_locker = self._redis_client.set(
            self._key, self._key, nx=True, ex=self._ex
        ) == 1
        return self._get_locker


def transfer_pending_list(redis_client: Redis, topic: str, group: str,
                          count: int, target_consumer: str, **kwargs):
    """

    Args:
        redis_client(Redis): Redis client
        topic(str): Topic
        group(str): Consumer group
        count(str): max count
        target_consumer(str):

    Keyword Args:
        min_id(str): Min ID
        max_id(str): Max ID
        min_idle_time(int): filter messages that were idle less than this
                            amount of milliseconds.
        filter_consumer(str): name of a consumer to filter by (optional).

    Returns:

    """
    min_id = kwargs.get("min_id", "-")
    max_id = kwargs.get("max_id", "+")
    min_idle_time = kwargs.get("min_idle_time", 0)
    filter_consumer = kwargs.get("filter_consumer", None)

    _message_ret = [[[], [], []]]
    pending_list = redis_client.xpending_range(
        topic, group, count=count, min=min_id, max=max_id,
        consumername=filter_consumer
    )
    if len(pending_list) > 0:
        pending_list = list(filter(
            lambda item: item.get('time_since_delivered',
                                  0) > min_idle_time,
            pending_list
        ))
        pending_ids = list(map(
            lambda item: item.get('message_id', '0-0'),
            pending_list
        ))
        if len(pending_ids) > 0:
            _message_ret = [[[], redis_client.xclaim(
                topic, group, target_consumer, min_idle_time,
                pending_ids
            )]]
    return _message_ret


class AtomicLong:
    """An atomic int based on thread lock"""

    def __init__(self, initial_value: int) -> None:
        self._value = initial_value
        self._lock = threading.Lock()

    @property
    def value(self) -> int:
        """Get current value
        """
        return self._value

    def inc(self, count: int = 1):
        with self._lock:
            self._value += count
            return self._value

    def set_and_get(self, target_value: int) -> int:
        with self._lock:
            self._value = target_value
            return self._value

    def get_and_set(self, target_value: int) -> int:
        with self._lock:
            pre_value = self._value
            self._value = target_value
            return pre_value
