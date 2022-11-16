# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                base.py
Description:
"""
from abc import ABCMeta, abstractmethod
import time


class ChannelException(Exception):
    def __init__(self, message: str) -> None:
        self.message = message

    def __str__(self) -> str:
        return self.message


class ChannelResult:
    def __init__(self, code: int = 0, result: str = "", err_msg: str = "") -> None:
        self.code = code
        self.result = result
        self.err_msg = err_msg


class BaseChannel(metaclass=ABCMeta):

    @staticmethod
    @abstractmethod
    def initial(**kwargs) -> ChannelResult:
        raise NotImplementedError

    @abstractmethod
    def run_command(self, **kwargs) -> ChannelResult:
        raise NotImplementedError
    
    def run_command_auto_retry(self, **kwargs) -> ChannelResult:
        timeout = kwargs.pop("timeout", 1000)
        if timeout is None:
            timeout = 1000
        if kwargs.pop("auto_retry", False):
            max_wait_time = time.time() + timeout / 1000
            remain_time = int((max_wait_time - time.time()) * 1000)
            kwargs["timeout"] = remain_time
            res = self.run_command(**kwargs)
            while res.code == 2 and remain_time > 0:
                remain_time = int((max_wait_time - time.time()) * 1000)
                kwargs["timeout"] = remain_time
                res = self.run_command(**kwargs)
            return res
        else:
            kwargs["timeout"] = timeout
            return self.run_command(**kwargs)