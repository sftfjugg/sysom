# -*- coding: utf-8 -*- #
"""
Time                2022/7/26 17:04
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                utils.py
Description:
"""
import uuid
from redis import Redis
from ..cec_base.url import CecUrl
from ..cec_base.base import ConnectException
from redis.exceptions import ConnectionError


def do_connect(url: str) -> Redis:
    cec_url = CecUrl.parse(url)
    return do_connect_by_cec_url(cec_url)


def do_connect_by_cec_url(cec_url: CecUrl) -> Redis:
    host_port = cec_url.netloc.split(":")
    if len(host_port) != 2:
        raise ConnectException(
            f"Not valid host:port => {host_port[0]}:{host_port[1]}")
    host, port = host_port[0], int(host_port[1])
    try:
        redis_client = Redis(host=host, port=port, db=0, decode_responses=True,
                             **cec_url.params)
        # 执行一个简单的get命令，使得客户端连接上redis服务器，如果连接失败
        # 会抛出异常
        # redis_client.get(str(uuid.uuid4()))
    except ConnectionError as e:
        raise ConnectException(e)
    return redis_client