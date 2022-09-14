# -*- coding: utf-8 -*- #
"""
Time                2022/7/27 15:55
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                meta.py
Description:
"""


class TopicMeta:
    """Common topic meta info definition

    通用 Topic 元数据信息定义

    Args:
        topic_name(str): 主题名字

    Attributes:
        topic_name(str): 主题名字
    """

    def __init__(self, topic_name: str = ""):
        self.topic_name = topic_name
        # example: 0 -> PartitionMeta(partition_id=xxx)
        self.partitions = {}
        self.error = None

    def __repr__(self):
        if self.error is not None:
            return f"TopicMeta({self.topic_name}, {len(self.partitions)} " \
                   f"partitions, {self.error})"
        else:
            return f"TopicMeta({self.topic_name}, {len(self.partitions)} " \
                   f"partitions)"

    def __str__(self):
        return self.topic_name


class PartitionMeta:
    """Common Partition meta info definition

    通用 Partition 元数据定义

    Args:

    """

    def __init__(self, partition_id: int = -1):
        self.partition_id = partition_id
        self.error = None

    def __repr__(self):
        if self.error is not None:
            return f"PartitionMeta({self.partition_id}, {self.error})"
        else:
            return f"PartitionMeta({self.partition_id})"

    def __str__(self):
        return f"{self.partition_id}"


class ConsumerGroupMeta:
    """Common Consumer Group meta info definition

    通用 ConsumerGroup 元数据定义

    """

    def __init__(self, group_id: str = ""):
        self.group_id = group_id
        self.members: [ConsumerGroupMemberMeta] = []
        self.error = None

    def __repr__(self):
        if self.error is not None:
            return f"ConsumerGroupMeta({self.group_id}, {len(self.members)} " \
                   f"members, {self.error})"
        else:
            return f"ConsumerGroupMeta({self.group_id}, {len(self.members)} " \
                   f"members)"

    def __str__(self):
        return self.group_id


class ConsumerGroupMemberMeta:
    """Common Consumer Group Member meta info definition

    通用 ConsumerGroupMember 元数据定义

    """

    def __init__(self, client_id: str = ""):
        self.client_id = client_id
        self.error = None

    def __repr__(self):
        if self.error is not None:
            return f"ConsumerGroupMemberMeta({self.client_id}, {self.error})"
        else:
            return f"ConsumerGroupMemberMeta({self.client_id})"
