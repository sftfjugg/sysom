# -*- encoding: utf-8 -*-
"""
@File    : seriaizer.py
@Time    : 2021/11/22 17:41
@Author  : DM
@Software: PyCharm
"""
from rest_framework import serializers
from apps.task.models import JobModel


class JobListSerializer(serializers.ModelSerializer):
    result = serializers.SerializerMethodField()

    class Meta:
        model = JobModel
        exclude = ('deleted_at', 'host_by', 'command')

    def get_result(self, attr: JobModel):
        return attr.result or '暂无'


class JobDelResultSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobModel
        exclude = ('deleted_at', 'host_by', 'command', 'result')