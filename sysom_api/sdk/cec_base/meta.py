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
        num_partitions(int): 分区数目
        replication_factor(int): 冗余系数
        expire_time(int): 事件有效时间

    Attributes:
        topic_name(str): 主题名字
        num_partitions(int): 分区数目
        replication_factor(int): 冗余系数
        expire_time(int): 事件有效时间
    """

    def __init__(self, topic_name: str = "", num_partitions: int = 1,
                 replication_factor: int = 1,
                 expire_time: int = 24 * 60 * 60 * 1000):
        self.topic_name = topic_name
        self.num_partitions = int(num_partitions)
        self.replication_factor = int(replication_factor)
        self.expire_time = int(expire_time)

    def to_dict(self):
        """Convert TopicMeta to dict

        Returns:
            dict: A dict contains topic meta info
        """
        return self.__dict__
