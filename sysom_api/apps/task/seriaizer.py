# -*- encoding: utf-8 -*-
"""
@File    : seriaizer.py
@Time    : 2021/11/22 17:41
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
from rest_framework import serializers
from apps.task.models import JobModel, ServiceModel


class JobListSerializer(serializers.ModelSerializer):
    job_result = serializers.SerializerMethodField()

    class Meta:
        model = JobModel
        exclude = ('deleted_at', )

    def get_job_result(self, attr: JobModel):
        return attr.job_result or '暂无'


class ServiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = ServiceModel
        exclude = ('deleted_at', )