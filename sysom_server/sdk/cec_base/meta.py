# -*- coding: utf-8 -*- #
"""
Time                2022/7/25 12:34
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                meta.py
Description:

This file define some meta info objects which used to manage CEC
"""
from typing import List


class TopicMeta:
    """Common Topic meta info definition

    This class define the Topic's meta info.

    Args:
        topic_name(str): Topic name

    Attributes:
        topic_name(str): Topic name
    """

    def __init__(self, topic_name: str = ""):
        self.topic_name = topic_name
        # example: 0 -> PartitionMeta(partition_id=xxx)
        self.partitions = {}
        self.error = None

    def __repr__(self):
        return f"TopicMeta(" \
               f"{self.topic_name}, {len(self.partitions)} partitions" \
               f"{f', {self.error}' if self.error is not None else ''}" \
               f")"

    def __str__(self):
        return self.topic_name


class PartitionMeta:
    """Common Partition meta info definition

    This class define the Partition's meta info.

    Args:
        partition_id(int): Partition ID

    Attributes:
        partition_id(int): Partition ID
    """

    def __init__(self, partition_id: int = -1):
        self.partition_id = partition_id
        self.error = None

    def __repr__(self):
        return f"PartitionMeta(" \
               f"{self.partition_id}" \
               f"{f', {self.error}' if self.error is not None else ''}" \
               f")"

    def __str__(self):
        return f"{self.partition_id}"


class ConsumerGroupMeta:
    """Common Consumer Group meta info definition

    This class define the ConsumerGroup's meta info.

    Args:
        group_id(str): Group ID

    Attributes:
        group_id(str): Group ID
    """

    def __init__(self, group_id: str = ""):
        self.group_id = group_id
        self.members: List[ConsumerGroupMemberMeta] = []
        self.error = None

    def __repr__(self):
        return f"ConsumerGroupMeta(" \
               f"{self.group_id}, {len(self.members)} members" \
               f"{f', {self.error}' if self.error is not None else ''}" \
               f")"

    def __str__(self):
        return self.group_id


class ConsumerGroupMemberMeta:
    """Common Consumer Group Member meta info definition

    This class define the ConsumerGroupMember's meta info

    Args:
        client_id(str): Client ID

    Attributes:
        client_id(str): Client ID
    """

    def __init__(self, client_id: str = ""):
        self.client_id = client_id
        self.error = None

    def __repr__(self):
        return f"ConsumerGroupMemberMeta(" \
               f"{self.client_id}" \
               f"{f', {self.error}' if self.error is not None else ''}" \
               f")"

    def __str__(self):
        return self.client_id
