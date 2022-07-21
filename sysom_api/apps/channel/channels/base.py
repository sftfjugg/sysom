"""
通道Base
"""
from abc import ABCMeta, abstractmethod


class BaseChannel(metaclass=ABCMeta):
    def __init__(self, **kwargs) -> None:
        self.connect_args = kwargs
        self._client = self.client(**kwargs)

    @abstractmethod
    def client(self, **kwargs):
        raise NotImplemented

    @abstractmethod
    def run_command(self, cmd):
        raise NotImplemented
