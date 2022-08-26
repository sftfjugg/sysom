"""
通道Base

多通道是以单文件的方式构成,文件名就是通道名称(例如: ssh.py 为ssh通道), 通道
文件中实现Channel类, 继承BaseChannel类, 必须实现client方法, run_command方法
"""
from abc import ABCMeta, abstractmethod
from django.db import connection

from ..models import ExecuteResult
from lib.exception import APIException


class BaseChannel(metaclass=ABCMeta):

    @abstractmethod
    def client(self, **kwargs):
        raise NotImplemented

    @abstractmethod
    def run_command(self, **kwargs):
        raise NotImplemented

    @classmethod
    def _save_execute_result(cls, kwargs):
        """
        执行Command信息添加到数据库
        kwargs: 
            invoke_id str 执行脚本ID
            result    dict 执行脚本后的结果，例如：{'state': 0, 'result': 'xxxxxxxx'} 0为执行成功, 1位=为执行失败
        """
        try:
            ExecuteResult.objects.create(**kwargs)
        except Exception as e:
            raise APIException(message=str(e))
        finally:
            connection.close()
