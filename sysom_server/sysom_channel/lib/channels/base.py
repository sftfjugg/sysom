"""
通道Base

多通道是以单文件的方式构成,文件名就是通道名称(例如: ssh.py 为ssh通道), 通道
文件中实现Channel类, 继承BaseChannel类, 必须实现client方法, run_command方法
"""
from abc import ABCMeta, abstractmethod


class ChannelException(Exception):
    def __init__(self, message: str) -> None:
        self.message = message

    def __str__(self) -> str:
        return self.message


class BaseChannel(metaclass=ABCMeta):

    @abstractmethod
    def client(self, **kwargs):
        raise NotImplementedError

    @staticmethod
    @abstractmethod
    def initial(**kwargs):
        raise NotImplementedError

    @abstractmethod
    def run_command(self, **kwargs):
        raise NotImplementedError
