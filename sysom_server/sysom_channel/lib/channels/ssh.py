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


import logging
from lib.utils import valid_params
from lib.ssh import SSH

from .base import BaseChannel, ChannelException


logger = logging.getLogger(__name__)


class Channel(BaseChannel):
    FIELDS = ('instance', 'command')

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
            self.shell_script = self.kwargs['command']
            
    @staticmethod
    def initial(**kwargs) -> bool:
        valid_result = valid_params(["instance", "password"], kwargs)
        if len(valid_result) == 0:
            host, password = kwargs.pop("instance"), kwargs.pop("password")
            port, username = kwargs.pop("port", 22), kwargs.pop("username", "root")
            success, err_msg = SSH.validate_ssh_host(host, password, port, username)
            if not success:
                raise ChannelException(err_msg)
        else:
            raise ChannelException(f"Missing parameters: {', '.join(valid_result)}")
        return 0, ""
    
    def client(self):
        return self.ssh if self.ssh else SSH(hostname=self.kwargs['instance'])

    def run_command(self):
        return self.ssh.run_command(self.shell_script)
