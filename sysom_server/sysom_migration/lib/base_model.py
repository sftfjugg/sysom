# -*- encoding: utf-8 -*-
"""
@File    : base_model.py
@Time    : 2021/10/28 11:04
@Author  : DM
@Software: PyCharm
"""

from django.db import models
from lib.utils import human_datetime
from django.forms.models import model_to_dict


class BaseModel(models.Model):
    """abstract model"""
    created_at = models.CharField(max_length=20, default=human_datetime, verbose_name="创建时间")
    updated_at = models.CharField(max_length=20, default=human_datetime, verbose_name="更新时间")

    def to_dict(self):
        result_dict = model_to_dict(self)
        result_dict['created_at'] = self.created_at
        result_dict['updated_at'] = self.updated_at
        return result_dict

    class Meta:
        abstract = True
