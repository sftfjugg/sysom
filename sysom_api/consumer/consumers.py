import logging
from threading import Thread
import threading
from urllib import parse
from channels.generic.websocket import WebsocketConsumer, JsonWebsocketConsumer
from channels.exceptions import StopConsumer
from django.conf import settings
import os
from django.conf import settings
from lib.utils import uuid_32
from sdk.cec_base.consumer import Consumer, dispatch_consumer

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
        from apps.channel.channels.ssh import SSH
        instance = get_host_instance(
            model=HostModel, ip=self.host_ip, created_by=self.user.id)
        if not instance:
            self.send(bytes_data=b'Not Found host / No Permission\r\n')
            self.close()
        self.host: HostModel = instance
        self.send(bytes_data=b'Welcome Using SysOM ^_^ ^_^ ^_^\r\n')
        self.send(bytes_data=b'\r\n')
        self.send(bytes_data=b'\r\n')
        self.send(bytes_data=b'Connecting ...\r\n')
        try:
            # self.ssh = self.host.get_host_client().get_client()
            self.ssh = SSH(
                hostname=instance.ip, username=instance.username, port=instance.port)._client
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
                    command = "%s  %s %s" % (
                        service_path, kernel_version, vmcore_file)
                    output = os.popen(command)
                    start_cmd = output.read()
                    self.xterm.send(start_cmd)
                else:
                    self.xterm.send(
                        "echo 'Can not find {} script file, please check script name'\n".format(option))
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


class NotificationManager:
    """A singleton class to manager user notification 

    一个单例类实现，用于记录用户的 websocket 列表，并在通知产生时下发给对应的客户端
    """
    def __init__(self) -> None:
        if not hasattr(NotificationManager, "_first_init"):
            # 事件中心消费客户端，用于从事件中心获取要推送的通知消息
            self._consumer: Consumer = None

            # websocket 映射，记录每一个 username => [websocket] 的映射
            self._ws_dict = {}
            # 记录连接的数量
            self._connection_count = 0
            self._inner_locker = threading.Lock()
            self._loop_message_thread: Thread = None
            NotificationManager._first_init = True

    def __new__(cls, *args, **kwargs):
        if not hasattr(NotificationManager, "_instance"):
            NotificationManager._instance = object.__new__(cls)
        return NotificationManager._instance

    def _loop_message(self):
        for message in self._consumer:
            sub = message.value.get('sub', '')
            if sub in self._ws_dict:
                for _id in self._ws_dict[sub]:
                    self._ws_dict[sub][_id].send_json(message.value)

    def _start_consume_thread(self):
        """Start consume thread

        启动消费线程，处理消费
        """
        if self._loop_message_thread is not None \
                and self._loop_message_thread.isAlive():
            return
        self._consumer = dispatch_consumer(
            settings.SYSOM_CEC_URL, settings.SYSOM_CEC_ALARM_TOPIC,
            consumer_id=Consumer.generate_consumer_id(), start_from_now=True
        )
        self._loop_message_thread = Thread(target=self._loop_message)
        self._loop_message_thread.start()

    def _stop_consume_thread(self):
        """ Stop consume thread

        停止消费线程
        """
        if self._loop_message_thread is not None \
                and self._loop_message_thread.isAlive():
            self._consumer.disconnect()
            self._consumer = None
            self._loop_message_thread.join()

    def on_websocket_connect(self, username: str, nc: JsonWebsocketConsumer) -> str:
        """invoke while a websocket connection establish successed

        一个接受推送通知的 Websocket 建立成功之后，将会调用这个函数
        """
        _id = uuid_32()
        with self._inner_locker:
            if username not in self._ws_dict:
                self._ws_dict[username] = {}
            self._ws_dict[username][_id] = nc
            self._connection_count += 1

            # 如果之前没有客户端，第一个客户端连接之后就启动消费线程
            if self._connection_count == 1:
                self._start_consume_thread()
        return _id

    def on_websocket_disconnect(self, username: str, _id: str):
        """invoke while a websocket connection disconnected

        一个接受推送通知的 Websocket 断开连接之后，将会调用这个函数
        """
        with self._inner_locker:
            if username in self._ws_dict:
                if self._ws_dict[username].pop(_id, None) is not None:
                    self._connection_count -= 1

                    # 如果客户端清空了，就停止消费线程
                    if self._connection_count == 0:
                        self._stop_consume_thread()


class NoticelconConsumer(JsonWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._user = None
        self._id = ""
        self._notification_manager = NotificationManager()

    def connect(self):
        self._user = self.scope['user']
        if self._user:
            self.accept()
            self._id = self._notification_manager.on_websocket_connect(
                self._user.username,
                self
            )
        else:
            self.close()

    def disconnect(self, code):
        """
        Websocket 断开连接时，断开与事件中心的连接，并释放线程资源
        """
        if self._user is not None:
            self._notification_manager.on_websocket_disconnect(
                self._user.username,
                self._id
            )
        return super().disconnect(code)
