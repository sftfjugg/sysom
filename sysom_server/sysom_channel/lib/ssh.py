# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                ssh.py
Description:
"""
import logging
import asyncio
from typing import Callable, Optional
import asyncssh
from io import StringIO
from asyncer import syncify
import concurrent
from conf.settings import *
from lib.channels.base import ChannelException, ChannelCode, ChannelResult

DEFAULT_CONNENT_TIMEOUT = 5000    # 默认ssh链接超时时间 5s
DEFAULT_NODE_USER = 'root'     # 默认节点用户名 root

logger = logging.getLogger(__name__)


class EasySSHCallbackForwarder(asyncssh.SSHClientSession):
    def __init__(
            self,
            data_received_callback: Optional[Callable[
                [str, asyncssh.DataType], None]] = None,
    ):
        super().__init__()
        self._result_io = StringIO()
        self._err_msg = ""
        self.data_received_callback = data_received_callback

    def data_received(self, data: str,
                      datatype: asyncssh.DataType = None) -> None:
        if self.data_received_callback is not None:
            self.data_received_callback(data, datatype)
        self._result_io.write(data)

    def connection_lost(self, exc: Optional[Exception]) -> None:
        if exc is not None:
            self._err_msg = str(exc)
            logger.exception(exc)

    def get_err_msg(self) -> str:
        return self._err_msg

    def get_total_result(self) -> str:
        return self._result_io.getvalue()


class AsyncSSH:

    # key_pair cached the key pair generated by initialization stage
    _key_pair = {}
    _private_key_getter: Optional[Callable[[], str]] = None
    _public_key_getter: Optional[Callable[[], str]] = None

    def __init__(self, hostname: str, **kwargs) -> None:
        self.connect_args = {
            "known_hosts": None,
            "port": kwargs.get("port", 22),
            "username": kwargs.get("username", "root"),
            "password": kwargs.get("password", None),
        }
        self._hostname = hostname
        password = kwargs.get("password", None)
        if password is None:
            if AsyncSSH._private_key_getter is None:
                raise ChannelException(
                    f"SSH Chanel: Connect to {hostname} failed, _private_key_getter not set",
                    code=ChannelCode.CHANNEL_CONNECT_FAILED.value,
                )
            # Auto fill private key if password not specific
            self.connect_args["client_keys"] = [SSH_CHANNEL_KEY_PRIVATE]

    @classmethod
    def set_private_key_getter(cls, private_key_getter: Callable[[], str]):
        # Save private key as file
        with open(SSH_CHANNEL_KEY_PRIVATE, "w") as f:
            f.write(private_key_getter())
        cls._private_key_getter = private_key_getter

    @classmethod
    def set_public_key_getter(cls, public_key_getter: Callable[[], str]):
        # Save public key as file
        with open(SSH_CHANNEL_KEY_PUB, "w") as f:
            f.write(public_key_getter())
        cls._public_key_getter = public_key_getter

    async def add_public_key_async(self, timeout: Optional[int] = None):
        if AsyncSSH._public_key_getter is None:
            raise ChannelException(
                f"SSH Chanel: Init {self._hostname} failed, _private_key_getter not set",
                code=ChannelCode.CHANNEL_CONNECT_FAILED.value,
            )
        public_key = AsyncSSH._public_key_getter()
        command = f'mkdir -p -m 700 ~/.ssh && \
        echo {public_key!r} >> ~/.ssh/authorized_keys && \
        chmod 600 ~/.ssh/authorized_keys'
        res = await self.run_command_async(command, timeout=timeout)
        if res.code != 0:
            raise ChannelException(
                f'Init {self._hostname} failed: {res.err_msg}',
                code=ChannelCode.CHANNEL_CONNECT_FAILED.value)

    def add_public_key(self, timeout: Optional[int] = None):
        syncify(self.add_public_key_async, raise_sync_error=False)(
            timeout
        )

    def run_command(
        self, command: str,
        timeout: Optional[int] = DEFAULT_CONNENT_TIMEOUT,
        on_data_received: Optional[Callable[[str, asyncssh.DataType], None]] = None,
    ) -> ChannelResult:
        return syncify(self.run_command_async, raise_sync_error=False)(
            command=command,
            timeout=timeout,
            on_data_received=on_data_received
        )

    async def run_command_async(
        self, command: str,
        timeout: Optional[int] = DEFAULT_CONNENT_TIMEOUT,
        on_data_received: Optional[Callable[[str, asyncssh.DataType], None]] = None,
    ) -> ChannelResult:
        channel_result = ChannelResult(
            code=1, result="SSH Channel: Run command error", err_msg="SSH Channel: Run command error")
        try:
            timeout /= 1000
            self.connect_args["connect_timeout"] = timeout
            async with asyncssh.connect(self._hostname, **self.connect_args) as conn:
                chan, session = await conn.create_session(
                    lambda: EasySSHCallbackForwarder(on_data_received), command
                )
                try:
                    await asyncio.wait_for(chan.wait_closed(), timeout=timeout)
                except asyncio.TimeoutError:
                    channel_result.code = ChannelCode.CHANNEL_EXEC_FAILED.value
                    channel_result.result = f"SSH Channel: Command execute timeout"
                    channel_result.err_msg = f"SSH Channel: Command execute timeout: {session.get_total_result()}"
                else:
                    # execute finish
                    exit_status = chan.get_exit_status()
                    if exit_status != 0:
                        channel_result.code = ChannelCode.CHANNEL_EXEC_FAILED.value
                        channel_result.result = session.get_total_result()
                        channel_result.err_msg = f"SSH Channel: Command exit code != 0 => {session.get_err_msg()}"
                    else:
                        channel_result.code = ChannelCode.SUCCESS.value
                        channel_result.err_msg = ""
                        channel_result.result = session.get_total_result()

        except asyncssh.misc.PermissionDenied as exc:
            # Auth failed exception
            channel_result.code = ChannelCode.CHANNEL_CONNECT_FAILED.value
            channel_result.result = f"SSH Channel: Auth failed (host = {self._hostname})"
            channel_result.err_msg = f"SSH Channel: Auth failed (host = {self._hostname}) => {str(exc)}"
            logger.exception(exc)
        except asyncssh.misc.ConnectionLost as exc:
            channel_result.code = ChannelCode.CHANNEL_CONNECT_FAILED.value
            channel_result.result = f"SSH Channel: Connection lost (host = {self._hostname})"
            channel_result.err_msg = f"SSH Channel: Connection lost (host = {self._hostname}) => {str(exc)}"
            logger.exception(exc)
        except ConnectionRefusedError as exc:
            channel_result.code = ChannelCode.CHANNEL_CONNECT_FAILED.value
            channel_result.result = f"SSH Channel: Connection refused (host = {self._hostname})"
            channel_result.err_msg = f"SSH Channel: Connection refused (host = {self._hostname}) => {str(exc)}"
            logger.exception(exc)
        except concurrent.futures._base.TimeoutError:
            channel_result.code = ChannelCode.CHANNEL_CONNECT_TIMEOUT.value
            channel_result.result = f"SSH Channel: Connect to {self._hostname} timeout."
            channel_result.err_msg = channel_result.result
        except Exception as exc:
            channel_result.code = ChannelCode.SERVER_ERROR.value
            channel_result.err_msg = f"SSH Channel: Unexpected error => {str(exc)}"
            # Unknown exception
            logger.exception(exc)
        return channel_result

    async def _do_scp(self, mode: str, local_path: str, remote_path: str):
        err: Optional[Exception] = None
        try:
            async with asyncssh.connect(self._hostname, **self.connect_args) as conn:
                if mode == "push":
                    await conn.run(f"mkdir -p {os.path.dirname(remote_path)}")
                    await asyncssh.scp(local_path, (conn, remote_path))
                else:
                    await asyncssh.scp((conn, remote_path), local_path)
        except asyncio.TimeoutError:
            err = asyncio.TimeoutError(f"Connect to {self._hostname} failed!")
        except Exception as e:
            err = e
        return err

    async def send_file_to_remote_async(self, local_path: str, remote_path: str):
        return await self._do_scp("push", local_path, remote_path)

    async def get_file_from_remote_async(self, local_path: str, remote_path: str):
        return await self._do_scp("pull", local_path, remote_path)
