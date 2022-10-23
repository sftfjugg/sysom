# -*- coding: utf-8 -*- #
"""
Time                2022/07/25 12:16
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                event.py
Description:

This file define the Event object used in CEC(Common Evcent Center)
"""

from typing import Union, Any


class Event:
    """Common Event Center Event definition

    This class define the Event model used in CEC

    Args:
        value(bytes | dict): The event content（support bytes and dict）
        event_id(str): Event ID

    Attributes:
        value(bytes | dict): The event content
        event_id(str): Event ID
    """

    def __init__(self, value: Union[bytes, dict] = None, event_id: str = ""):
        if value is None:
            value = {}
        self.value = value
        self.event_id = event_id

        # An inner storage, used to cache some internal data related to
        # specific event objects
        self._cache = {}

    def put(self, key: str, value: Any):
        """Store something in inner cache

        The current interface is only used inside the module，used cached some
        internal data.

        Args:
            key(str):
            value(any):

        Returns:

        """
        self._cache[key] = value

    def get(self, key):
        """Get something from inner cache

        The current interface is only used inside the module，used get some
        internal data cached in current Event object.

        Args:
            key:

        Returns:

        """
        return self._cache.get(key)

    def __repr__(self):
        return f"Event({self.event_id}, {self.value}) "

    def __str__(self):
        return self.event_id
