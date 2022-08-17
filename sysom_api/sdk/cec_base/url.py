# -*- coding: utf-8 -*- #
"""
Time                2022/7/25 16:03
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                url_test.py
Description:
"""
import urllib.parse


class CecUrl:
    """CecUrl definition

    Cec URL 格式定义，其由三部分组成（proto, connect_url, params）

    Args:
        proto(str): 协议标识（例如：redis）
        netloc(str): 连接地址，主要用于连接低层的消息中间件（例如：localhost:6379）
        params(dict): 连接参数（例如：{"password": "123456"}）

    Attributes:
        proto(str): 协议标识（例如：redis）
        netloc(str): 连接地址，主要用于连接低层的消息中间件（例如：localhost:6379）
        params(dict): 连接参数（例如：{"password": "123456"}）
    """

    def __init__(self, proto: str, netloc: str, params: dict):
        self.proto = proto
        self.netloc = netloc
        self.params = params

    def __str__(self):
        return f"{self.proto}://{self.netloc}?" \
               f"{urllib.parse.urlencode(self.params)}"

    @staticmethod
    def parse(url: str):
        parse_result = urllib.parse.urlparse(url)
        proto, netloc = parse_result.scheme, parse_result.netloc
        query_str, params = parse_result.query, dict()
        if proto == '' or netloc == '':
            raise NotValidCecUrlException(url)
        for param in query_str.split('&'):
            if param.strip() == '':
                continue
            param_split = param.split('=')
            if len(param_split) != 2:
                raise NotValidCecUrlException(
                    f"params error: {param}, url: {url}")
            params[param_split[0]] = param_split[1]
        return CecUrl(proto, netloc, params)


class NotValidCecUrlException(Exception):
    pass
