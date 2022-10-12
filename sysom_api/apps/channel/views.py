import logging
import re
import os
from django.conf import settings
from django.db import connection
from rest_framework.viewsets import GenericViewSet
from .models import ExecuteResult
from lib.response import other_response
from lib.channels.ssh import SSH
from lib.exception import APIException
from lib.utils import import_string


logger = logging.getLogger(__name__)


class ChannelAPIView(GenericViewSet):
    authentication_classes = []
    result = dict()

    def get_exec_result(self, request):
        try:
            instance = ExecuteResult.objects.get(invoke_id=request.data.get('invoke_id'))
        except ExecuteResult.DoesNotExist as e:
            return other_response(code=400, message='invoke_id 不存在!')
        return other_response(message='操作成功', result=instance.result)

    def valid_channel(self, request):
        data = getattr(request, 'data')
        channel_type = data.pop('channel', 'ssh')
        package = import_string(f'lib.channels.{channel_type}')
        try:
            package.Channel(**data)
            return import_string(f'lib.channels.{channel_type}')
        except Exception as e:
            logger.error(e)

        channels_path = os.path.join(settings.BASE_DIR, 'lib', 'channel', 'channels')
        packages = [dir.replace('.py', '') for dir in os.listdir(channels_path) if not dir.startswith('__')]
        packages.remove('base')
        packages.remove('ssh')

        for i, pkg in enumerate(packages):
            try:
                package = import_string(f'lib.channels.{pkg}')
                package.Channel(**request.data)
                channel_type = pkg
                break
            except Exception as e:
                logger.error(e)
                if i+1 == len(packages):
                    raise APIException(message='No channels available!')
                continue
        return import_string(f'lib.channels.{channel_type}')

    def channel_post(self, request, *args, **kwargs):
        channel_type = request.data.get('channel', 'ssh')
        package = self.valid_channel(request)

        data = request.data
        data['channel_name'] = channel_type

        channel = package.Channel(**data)
        result  = channel.run_command()

        kwargs.update(result)
        kwargs.pop('state')
        kwargs['channel_name'] = channel_type
        self._save_execute_result(kwargs)

        return other_response(result=result, message='操作成功')

    def _save_execute_result(self, kwargs):
        """
        执行Command信息添加到数据库
        kwargs: 
            channel_name str 执行脚本通道文件名 默认 ssh
            invoke_id str 执行脚本ID
            result    dict 执行脚本后的结果，例如：{'state': 0, 'result': 'xxxxxxxx'} 0为执行成功, 1位=为执行失败
        """
        if not kwargs.get('channel_name', None):
            kwargs['channel_name'] = 'ssh'
        try:
            ExecuteResult.objects.create(**kwargs)
        except Exception as e:
            raise APIException(message=str(e))
        finally:
            connection.close()

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

        s, m = SSH.validate_ssh_host(**kwargs)
        if s:
            return other_response(message=m)
        else:
            return other_response(message=m, code=400, success=False)

    def _validate_ip_format(self, ip) -> bool:
        p = '((\d{1,2})|([01]\d{2})|(2[0-4]\d)|(25[0-5]))'
        pattern = '^' + '\.'.join([p]*4) + '$'
        return bool(re.match(pattern, ip))
