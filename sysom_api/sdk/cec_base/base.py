# -*- coding: utf-8 -*- #
"""
Time                2022/9/25 13:02
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                base.py
Description:

This file defines some common interfaces which represents the common behavior
of Consumer, Admin and Producer
"""

from abc import ABCMeta, abstractmethod


class Connectable(metaclass=ABCMeta):
    """An abstract class defines the general behavior of connectable objects

    """

    @abstractmethod
    def connect(self, url: str):
        """Connect to remote server by url

        Connecting to a remote Server via a URL, the format of the URL can be
        agreed upon.

        Args:
          url(str): An identifier for connecting to the server

        Returns:

        """
        raise NotImplementedError

    @abstractmethod
    def disconnect(self):
        """Disconnect from remote server

        Disconnecting from the remote server.

        Returns:

        """
        raise NotImplementedError

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
