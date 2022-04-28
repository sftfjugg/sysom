import logging
import json
from threading import Thread
from urllib import parse
from channels.generic.websocket import WebsocketConsumer
from channels.exceptions import StopConsumer
from django.conf import settings
from django_redis import get_redis_connection

import os


logger = logging.getLogger(__name__)


def get_host_instance(model, **kwargs):
    """async orm"""
    return model.objects.filter(**kwargs).first()


class SshConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.host_ip = None
        self.start_cmd = None
        self.ssh = None
        self.xterm = None

    def connect(self):
        self.user = self.scope['user']
        query = self.scope.get('query')
        self.host_ip = query.get('host_ip', None)
        self.start_cmd = query.get('start', None)

        if not self.user or not self.host_ip:
            logger.info('链接失败')
            self.close()
        else:
            self.accept()
            self._connect_host_init()

    def _connect_host_init(self):
        """初始化host连接"""
        from apps.host.models import HostModel
        instance = get_host_instance(model=HostModel, ip=self.host_ip, created_by=self.user.id)
        if not instance:
            self.send(bytes_data=b'Not Found host / No Permission\r\n')
            self.close()
        self.host: HostModel = instance
        self.send(bytes_data=b'Welcome Using SysOM ^_^ ^_^ ^_^\r\n')
        self.send(bytes_data=b'\r\n')
        self.send(bytes_data=b'\r\n')
        self.send(bytes_data=b'Connecting ...\r\n')
        try:
            self.ssh = self.host.get_host_client().get_client()
        except Exception as e:
            self.send(bytes_data=f'Exception: {e}\r\n'.encode())
            self.close()
            return
        self.xterm = self.ssh.invoke_shell(term='xterm')
        self.xterm.transport.set_keepalive(30)
        if self.start_cmd:
            start_cmd = eval(parse.unquote(self.start_cmd))
            if isinstance(start_cmd, dict):
                SCRIPTS_DIR = settings.SCRIPTS_DIR
                start_dict = start_cmd
                option = start_dict.get("option")
                kernel_version = start_dict.get("kernel_version")
                vmcore_file = start_dict.get("vmcore_file")
                service_path = os.path.join(SCRIPTS_DIR, option)
                if os.path.exists(service_path):
                    command = "%s  %s %s" % (service_path, kernel_version, vmcore_file)
                    output = os.popen(command)
                    start_cmd = output.read()
                    self.xterm.send(start_cmd)
                else:
                    self.xterm.send("echo 'Can not find {} script file, please check script name'\n".format(option))
            else:
                try:
                    self.xterm.send(eval(parse.unquote(start_cmd))+'\n')
                except Exception as e:
                    self.xterm.send(parse.unquote(start_cmd)+'\n')

        Thread(target=self.loop_read).start()

    def loop_read(self):
        while True:
            data = self.xterm.recv(1024)
            if not data:
                self.close()
                break
            self.send(bytes_data=data)

    def receive(self, text_data=None, bytes_data=None):
        data = text_data or bytes_data
        if data:
            self.xterm.send(data)

    def websocket_disconnect(self, message):
        raise StopConsumer()


class NoticelconConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._user = None
        self._subs = None
        self._pubsub = None
        self.rds = get_redis_connection('noticelcon')
    
    def connect(self):
        self._user = self.scope['user']
        if self._user:
            self.accept()
            self._get_user_sub()
            Thread(target=self.loop_message).start()
        else:
            self.close()
    
    def _get_user_sub(self):
        self._subs = self._user.subs.filter(deleted_at=None).values('title')

        self._pubsub = self.rds.pubsub()
        for sub in self._subs:
            self._pubsub.subscribe(sub['title'])
        
    def loop_message(self):
        for item in self._pubsub.listen():
            result = dict()
            result['sub'] = str(item['channel'], encoding='gbk')
            result['message'] = item['data'] if isinstance(item['data'], int) else json.loads(item['data'].decode())

            self.send(text_data=result)

    def send(self, text_data=None, bytes_data=None, close=False):
        if isinstance(text_data, dict):
            text_data = json.dumps(text_data)
        return super().send(text_data, bytes_data, close)
