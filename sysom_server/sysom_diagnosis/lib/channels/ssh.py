'''
@File: ssh.py
@Time: 2022-08-30 11:13:55
@Author: DM
@Email: wb-msm261421@alibaba-inc.com
@Desc: ssh通道
'''

# SSH args eg:
#	"channel": "ssh",        选填 (默认ssh)
#	"instance": "xxxxxxxx",  必填
#   "cmd": "xxxx"             必填


import json
import paramiko
from loguru import logger
from io import StringIO
from paramiko.client import SSHClient, AutoAddPolicy
from paramiko.rsakey import RSAKey
from sysom_diagnosis.settings import KEY_PATH
from lib.utils import uuid_8

from .base import BaseChannel


DEFAULT_CONNENT_TIMEOUT = 5    # 默认ssh链接超时时间 5s
DEFAULT_NODE_USER = 'root'     # 默认节点用户名 root


class SSH:
    """
    args: 
        - hostname         主机IP (必填) 
        - username         主机用户名, 默认 'root'
        - port             主机开放端口, 默认 22
        - connect_timeout  连接超时时间 默认 5s
    """

    def __init__(self, hostname: str, **kwargs) -> None:
        self.connect_args = {
            'hostname': hostname,
            'username': kwargs.get('username', DEFAULT_NODE_USER),
            'port': kwargs.get('port', 22),
            'timeout': kwargs.get('timeout', DEFAULT_CONNENT_TIMEOUT),
        }
        if 'password' in kwargs:
            self.connect_args['password'] = kwargs.get('password')
        else:
            self.connect_args['pkey'] = RSAKey.from_private_key(
                StringIO(self.get_ssh_key()['private_key']))

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
    def get_ssh_key(cls) -> dict:
        try:
            with open(KEY_PATH, 'r') as f:
                return json.loads(f.read())
        except Exception as e:
            logger.error(e)
        return {}

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
            raise Exception('No client!')

    def add_public_key(self):
        public_key = self.get_ssh_key()['public_key']
        command = f'mkdir -p -m 700 ~/.ssh && \
        echo {public_key!r} >> ~/.ssh/authorized_keys && \
        chmod 600 ~/.ssh/authorized_keys'
        statue, _ = self.run_command(command)
        if statue != 0:
            raise Exception('add public key faild!')

    @staticmethod
    def validate_ssh_host(ip: str, password: str, port: int = 22, username: str = 'root'):
        try:
            ssh = SSH(hostname=ip, password=password,
                      port=port, username=username, timeout=2)
            ssh.add_public_key()
            return True, 'authorization success'
        except Exception as e:
            return False, f'error: {e}'


class Channel(BaseChannel):
    FIELDS = ('instance', 'cmd')

    def __init__(self, *args, **kwargs) -> None:
        self.kwargs = kwargs
        self.ssh = None
        self.shell_script = None

        self.validate_kwargs()

    def validate_kwargs(self):
        for item in filter(
            lambda x: not x[1], [(field, self.kwargs.get(field, None))
                                 for field in self.FIELDS]
        ):
            raise Exception(f'parameter: {item[0]} not found!')

        if not self.ssh:
            self.ssh = SSH(hostname=self.kwargs['instance'])
            self.shell_script = self.kwargs['cmd']

    def client(self):
        return self.ssh if self.ssh else SSH(hostname=self.kwargs['instance'])

    def run_command(self):
        kwargs = dict()
        invoke_id = uuid_8()
        kwargs['invoke_id'] = invoke_id
        status, res = self.ssh.run_command(self.shell_script)
        return {
            'invoke_id': invoke_id,
            'state': status,
            'result': {'state': status, 'result': res},
        }
