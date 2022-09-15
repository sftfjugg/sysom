# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/25
Description:
"""


class Event(object):
    """Common Event Center Event definition

    通用事件中心 Event 定义

    Args:
        value(dict): The event content
        event_id(str): Event ID

    Attributes:
        value(dict): The event content
        event_id(str): Event ID
    """

    def __init__(self, value=None, event_id: str = ""):
        if value is None:
            value = dict()
        self.value = value
        self.event_id = event_id

        # cache 用于底层实现缓存数据，用户代码不应当依赖该属性
        self._cache = dict()

    def put(self, key: str, value):
        self._cache[key] = value

    def get(self, key):
        return self._cache.get(key)

    def __repr__(self):
        return f"Event({self.event_id}, {self.value}) "

    def __str__(self):
        return self.event_id
