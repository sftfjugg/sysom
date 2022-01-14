import json
import logging
from threading import Thread

from channels.generic.websocket import WebsocketConsumer
from channels.exceptions import StopConsumer
from django_redis import get_redis_connection

from apps.host.models import HostModel


logger = logging.getLogger(__name__)


def get_host_instance(model, **kwargs):
    """async orm"""
    return model.objects.filter(**kwargs).first()


class SshConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.host_id = None
        self.ssh = None
        self.xterm = None

    def connect(self):
        self.user = self.scope['user']
        self.host_id = self.scope['url_route']['kwargs']['id']

        if not self.user:
            self.close()
        else:
            self.accept()
            self._connect_host_init()

    def _connect_host_init(self):
        """初始化host连接"""
        instance = get_host_instance(model=HostModel, pk=self.host_id, created_by=self.user.id)
        if not instance:
            self.send(bytes_data=b'Not Found host / No Permission\r\n')
            self.close()
        self.host: HostModel = instance
        self.send(bytes_data=b'Connecting ...\r\n')
        try:
            self.ssh = self.host.get_host_client().get_client()
        except Exception as e:
            self.send(bytes_data=f'Exception: {e}\r\n'.encode())
            self.close()
            return
        self.xterm = self.ssh.invoke_shell(term='xterm')
        self.xterm.transport.set_keepalive(30)
        Thread(target=self.loop_read).start()

    def loop_read(self):
        while True:
            data = self.xterm.recv(32 * 1024)
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