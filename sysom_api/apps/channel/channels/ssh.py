import json
import logging
import paramiko
from io import StringIO
from paramiko.client import SSHClient, AutoAddPolicy
from paramiko.rsakey import RSAKey 

from .base import BaseChannel
from ..models import SettingsModel

__all__ = ['SSH']

class ChannelError(paramiko.AuthenticationException):
    def __init__(self, code=400, message='后端异常', args=('后端异常',)) -> None:
        self.code = code
        self.message = message
        self.args = args

    def __str__(self):
        return self.message


class SSHChannel(BaseChannel):
    """
    args: 
        - hostname         主机IP (必填) 
        - username         主机用户名, 默认 'root'
        - port             主机开放端口, 默认 22
        - connect_timeout  连接超时时间 默认 5s
    """
    SSH_KEY = ''

    def __init__(self, hostname: str, **kwargs) -> None:
        self.connect_args = {
            'hostname': hostname,
            'username': kwargs.get('username', 'root'),
            'port': kwargs.get('port', 22),
            'timeout': kwargs.get('timeout', 5),
        }
        if 'password' in kwargs:
            self.connect_args['password'] = kwargs.get('password')
        else:
            self.connect_args['pkey'] = RSAKey.from_private_key(StringIO(self.get_ssh_key()['private_key']))
        self._client: SSHClient = self.client()

    def client(self):
        try:
            client = SSHClient()
            client.set_missing_host_key_policy(AutoAddPolicy)
            client.connect(**self.connect_args)
            return client
        except paramiko.AuthenticationException:
            raise Exception('authorization fail, password or pkey error!')
        except:
            raise Exception('authorization fail!')

    @classmethod
    def get_ssh_key(self) -> dict:
        instance = SettingsModel.objects.get(key='ssh_key')
        return json.loads(instance.value)

    def run_command(self, command):
        if self._client:
            ssh_session = self._client.get_transport().open_session()
            ssh_session.set_combine_stderr(True)
            ssh_session.exec_command(command)
            stdout = ssh_session.makefile("rb", -1)
            statue = ssh_session.recv_exit_status()
            output = stdout.read().decode()
            return statue, output
        else:
            raise

    def add_public_key(self):
        public_key = self.get_ssh_key()['public_key']
        command = f'mkdir -p -m 700 ~/.ssh && \
        echo {public_key!r} >> ~/.ssh/authorized_keys && \
        chmod 600 ~/.ssh/authorized_keys'
        statue, _  = self.run_command(command)
        if statue != 0:
            raise Exception('add public key faild!')

    @staticmethod
    def validate_ssh_host(ip: str, password: str, port: int=22, username: str='root'):
        try:
            ssh = SSHChannel(hostname=ip, password=password, port=port, username=username, timeout=2)
            ssh.add_public_key()
            return True, 'authorization success'
        except Exception as e:
            return False, f'error: {e}'
