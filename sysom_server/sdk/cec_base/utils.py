# -*- coding: utf-8 -*- #
"""
Time                2022/12/1 10:15
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                utils.py
Description:
"""
import threading


class StoppableThread(threading.Thread):
    """Thread class with a stop() method
    The thread itself has to check regularly for the stopped() condition.
    """

    def __init__(self, group=None, target=None, **kwargs):
        super().__init__(group, target, **kwargs)
        self._stop_event = threading.Event()

    def stop(self):
        """Notify the thread to exit（async）"""
        self._stop_event.set()

    def stopped(self):
        """Determine whether the thread exits."""
        return self._stop_event.is_set()
