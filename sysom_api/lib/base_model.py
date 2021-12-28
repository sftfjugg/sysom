# -*- encoding: utf-8 -*-
"""
@File    : base_model.py
@Time    : 2021/10/28 11:04
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""

from django.db import models
from lib import human_datetime


class BaseModel(models.Model):
    """abstract model"""
    created_at = models.CharField(max_length=20, default=human_datetime, verbose_name="创建时间")
    deleted_at = models.CharField(max_length=20, null=True)

    class Meta:
        abstract = True
