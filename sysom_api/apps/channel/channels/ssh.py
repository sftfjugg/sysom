import json
import logging
import paramiko
from io import StringIO
from paramiko.client import SSHClient, AutoAddPolicy
from paramiko.rsakey import RSAKey
from django.db import connection

from .base import BaseChannel
from ..models import SettingsModel, ExecuteResult
from lib.exception import APIException
from lib.utils import uuid_8


logger = logging.getLogger(__name__)


class ChannelError(paramiko.AuthenticationException):
    def __init__(self, code=400, message='后端异常', args=('后端异常',)) -> None:
        self.code = code
        self.message = message
        self.args = args

    def __str__(self):
        return self.message


class SSH:
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
            raise APIException(message=f'parameter: {item[0]} not found!')

        if not self.ssh:
            self.ssh = SSH(hostname=self.kwargs['instance'])
            self.shell_script = self.kwargs['cmd']

    def client(self):
        return self.ssh if self.ssh else SSH(hostname=self.kwargs['instance'])

    def run_command(self):
        kwargs = dict()
        task_id = uuid_8()
        kwargs['task_id'] = task_id

        status, res = self.ssh.run_command(self.shell_script)
        kwargs['result'] = {'state': status, 'result': res}
        
        self._save_execute_result(kwargs)
        return {
            'task_id': task_id,
            'state': status
        }
