# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                ssh.py
Description:
"""

# SSH args eg:
# "channel": "ssh",        选填 (默认ssh)
# "instance": "xxxxxxxx",  必填
#   "cmd": "xxxx"             必填


from loguru import logger
from typing import Optional
from lib.ssh import AsyncSSH

from .base import BaseChannel, ChannelResult


class Channel(BaseChannel):
    DEFAULT_TIMEOUT = 1000
    FIELDS = ('instance', 'command')

    def __init__(self, *args, **kwargs) -> None:
        self._kwargs = kwargs
        self._ssh_client: Optional[AsyncSSH] = None
        self._command: str = ""

        self._validate_kwargs()

    def _validate_kwargs(self):
        if "instance" not in self._kwargs:
            raise Exception(f"parameter: instance not found")
        if "command" not in self._kwargs:
            raise Exception("parameter: command not found")

        if self._ssh_client is None:
            self._ssh_client = AsyncSSH(self._kwargs['instance'], **self._kwargs)
            self._command = self._kwargs["command"]

    def get_params(self, **kwargs) -> dict:
        return self._kwargs

    @staticmethod
    def initial(**kwargs) -> bool:
        result = ChannelResult()
        try:
            AsyncSSH(kwargs.pop("instance", ""), **kwargs).add_public_key(
                timeout=kwargs.pop("timeout", Channel.DEFAULT_TIMEOUT)
            )
            result.code = 0
            result.result = ""
        except Exception as e:
            logger.exception(e)
            result.code = 1
            result.err_msg = str(e)
        return result

    @staticmethod
    async def initial_async(**kwargs) -> ChannelResult:
        result = ChannelResult()
        try:
            await AsyncSSH(kwargs.pop("instance", ""), **kwargs).add_public_key_async(
                timeout=kwargs.pop("timeout", Channel.DEFAULT_TIMEOUT)
            )
            result.code = 0
            result.result = ""
        except Exception as e:
            logger.exception(e)
            result.code = 1
            result.err_msg = str(e)
        return result

    def run_command(self, **kwargs):
        return self._ssh_client.run_command(self._command, **kwargs)

    async def run_command_async(self, **kwargs) -> ChannelResult:
        return await self._ssh_client.run_command_async(self._command, **kwargs)
