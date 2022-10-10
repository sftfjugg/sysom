# -*- coding: utf-8 -*- #
"""
Time                2022/7/29 11:28
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                utils.py
Description:
"""
from redis import Redis
import redis
from ..cec_base.url import CecUrl
from ..cec_base.exceptions import CecConnectionException
from ..cec_base.log import LoggerHelper


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
