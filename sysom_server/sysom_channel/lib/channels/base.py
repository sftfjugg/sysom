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
import anyio
import functools
from enum import Enum, unique


@unique
class ChannelCode(Enum):
    SUCCESS = 0
    SERVER_ERROR = 1
    REQUEST_PARAM_ERROR = 2
    CHANNEL_CONNECT_FAILED = 3
    CHANNEL_CONNECT_TIMEOUT = 4
    CHANNEL_EXEC_FAILED = 5


class ChannelException(Exception):
    """Exception which raise while use specific channel to communicate with instance

    Args:
        message(str): Detailed error messages for developers to locate problems
        code(str): Error type
        summary(str): Error summary for presentation to the user
    """

    def __init__(self, message: str, code: int = ChannelCode.SERVER_ERROR.value,
                 summary: str = None) -> None:
        self.message = message
        self.code = code
        self.summary = summary if summary is not None else message

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

    @staticmethod
    async def initial_async(**kwargs) -> ChannelResult:
        return await anyio.to_thread.run_sync(
            functools.partial(BaseChannel.initial, **kwargs)
        )

    @abstractmethod
    def run_command(self, **kwargs) -> ChannelResult:
        raise NotImplementedError

    async def run_command_async(self, **kwargs) -> ChannelResult:
        return await anyio.to_thread.run_sync(
            functools.partial(self.run_command, **kwargs)
        )

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

    async def run_command_auto_retry_async(self, **kwargs) -> ChannelResult:
        timeout = kwargs.pop("timeout", 1000)
        if timeout is None:
            timeout = 1000
        if kwargs.pop("auto_retry", False):
            max_wait_time = time.time() + timeout / 1000
            remain_time = int((max_wait_time - time.time()) * 1000)
            kwargs["timeout"] = remain_time
            res = await self.run_command_async(**kwargs)
            while res.code == 2 and remain_time > 0:
                remain_time = int((max_wait_time - time.time()) * 1000)
                kwargs["timeout"] = remain_time
                res = await self.run_command_async(**kwargs)
            return res
        else:
            kwargs["timeout"] = timeout
            return await self.run_command_async(**kwargs)
