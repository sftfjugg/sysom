# -*- coding: utf-8 -*- #
"""
Time                2022/7/25 14:02
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                url.py
Description:
"""

import urllib.parse
from .exceptions import CecNotValidCecUrlException


class CecUrl:
    """CecUrl definition

    Cec URL format definition, which consists of three parts
    (proto, netloc, params)

    Args:
        proto(str): Protocol identifier (e.g., redis)
        netloc(str): Connection address, mainly used to connect to low-level
                     messaging middleware (e.g., localhost:6379)
        params(dict): Connection parameters (e.g., {"password": "123456"})

    Attributes:
        proto(str): Protocol identifier (e.g., redis)
        netloc(str): Connection address, mainly used to connect to low-level
                     messaging middleware (e.g., localhost:6379)
        params(dict): Connection parameters (e.g., {"password": "123456"})
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
        """Parses a string into a CecUrl object

        Args:
            url(str)

        Returns:
            CecUrl
        """
        parse_result = urllib.parse.urlparse(url)
        proto, netloc = parse_result.scheme, parse_result.netloc
        query_str, params = parse_result.query, {}
        if proto == '' or netloc == '':
            raise CecNotValidCecUrlException(url)
        for param in query_str.split('&'):
            if param.strip() == '':
                continue
            param_split = param.split('=')
            if len(param_split) != 2:
                raise CecNotValidCecUrlException(
                    f"params error: {param}, url: {url}")
            params[param_split[0]] = param_split[1]
        return CecUrl(proto, netloc, params)
