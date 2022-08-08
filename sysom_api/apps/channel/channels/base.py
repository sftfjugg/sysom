"""
通道Base

多通道是以单文件的方式构成,文件名就是通道名称(例如: ssh.py 为ssh通道), 通道
文件中实现Channel类, 继承BaseChannel类, 必须实现client方法, run_command方法
"""
from abc import ABCMeta, abstractmethod


class BaseChannel(metaclass=ABCMeta):

    @abstractmethod
    def client(self, **kwargs):
        raise NotImplemented

    @abstractmethod
    def run_command(self, cmd):
        raise NotImplemented
