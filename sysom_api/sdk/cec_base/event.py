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
