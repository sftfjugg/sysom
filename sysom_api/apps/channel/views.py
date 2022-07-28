import time
import logging
import re
import json
from threading import Thread
from rest_framework.viewsets import GenericViewSet
from .models import ExecuteResult
from lib.response import other_response
from lib.utils import uuid_8
from .channels.ssh import SSHChannel


logger = logging.getLogger(__file__)


class ChannelAPIView(GenericViewSet):
    authentication_classes = []
    result = dict()

    def get_exec_result(self, request):
        try:
            instance = ExecuteResult.objects.get(task_id=request.data.get('task_id'))
        except ExecuteResult.DoesNotExist as e:
            return other_response(code=400, message='task_id 不存在!')
        return other_response(message='操作成功', result=json.loads(instance.result))

    def channel_post(self, request, *args, **kwargs):
        data = getattr(request, 'data')
        result = dict()

        channel = data.get('channel', None)
        if channel is None or channel == 'ssh':
            res, msg = self.validate_ssh_channel_parame(data)
            if not res:
                return other_response(code=400, message=msg, success=False)
            try:
                ssh = SSHChannel(hostname=data['instance'])
                state, res = ssh.run_command(data['cmd'])
                task_id = uuid_8()
                ExecuteResult.objects.create(task_id=task_id, result=json.dumps({'state': state, 'result': res}))
                result['task_id'] = task_id
                result['state'] = state
            except Exception as e:
                return other_response(code=400, message=f'Error: {e}', success=False)
        else:
            return other_response(code=400, message='channel 不存在!', success=False)
        return other_response(result=result, message='操作成功')

    def validate_ssh_channel_parame(self, data):
        res, message = False, ''
        if not data.get('instance') or not self._validate_ip_format(data['instance']):
            message = 'instance: 检查instance字段'
        else:
            res = True
        return res, message

    def permission_validate_host_ip(self):
        """
        检验当前请求是否有权限操作该host
        """
        pass

    def validate_host_channel(self, request, *args, **kwarg):
        """
        检验host主机password, 校验成功后自动添加public-key到该机器
        校验失败返回400, 及错误原因
        - ip (主机IP 必填)
        - password (主机密码 必填)
        - username (主机用户名 默认root)
        - port (主机开放端口 默认22)
        """
        requied_fields = ['ip', 'password']
        data = request.data

        for item in filter(lambda x: not x[1], [(field, data.get(field)) for field in requied_fields]):
            return other_response(code=400, message=f'{item[0]}: required field', success=False)
        
        if not self._validate_ip_format(data['ip']):
            return other_response(code=400, message='IP: 检查ip格式', success=False)
        
        kwargs = {}
        kwargs['ip'] = data.get('ip')
        kwargs['password'] = data.get('password')
        if 'username' in data:
            kwargs['username'] = data.get('username')
        if 'port' in data:
            kwargs['port'] = data.get('port')

        s, m = SSHChannel.validate_ssh_host(**kwargs)
        if s:
            return other_response(message=m)
        else:
            return other_response(message=m, code=400, success=False)

    def _validate_ip_format(self, ip) -> bool:
        p = '((\d{1,2})|([01]\d{2})|(2[0-4]\d)|(25[0-5]))'
        pattern = '^' + '\.'.join([p]*4) + '$'
        return bool(re.match(pattern, ip))