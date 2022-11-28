# -*- encoding: utf-8 -*-
"""
@File    : base_model.py
@Time    : 2021/10/28 11:04
@Author  : DM
@Software: PyCharm
"""

from django.db import models
from lib.utils import human_datetime


class BaseModel(models.Model):
    """abstract model"""
    created_at = models.CharField(max_length=20, default=human_datetime, verbose_name="创建时间")
    updated_at = models.CharField(max_length=20, default=human_datetime, verbose_name="更新时间")

    class Meta:
        abstract = True
