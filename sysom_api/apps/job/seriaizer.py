# -*- encoding: utf-8 -*-
"""
@File    : seriaizer.py
@Time    : 2021/11/22 17:41
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
from rest_framework import serializers
from apps.job.models import JobModel


class JobListSerializer(serializers.ModelSerializer):
    job_result = serializers.SerializerMethodField()
    src_instance = serializers.SerializerMethodField()
    dest_instance = serializers.SerializerMethodField()

    class Meta:
        model = JobModel
        exclude = ('deleted_at', )

    def get_job_result(self, attr: JobModel):
        return attr.job_result or '暂无'

    def get_src_instance(self, attr: JobModel):
        return attr.src_instance or '暂无'

    def get_dest_instance(self, attr: JobModel):
        return attr.dest_instance or '暂无'


class JobSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobModel
        fields = ('instance_id', 'command', 'status', 'job_result')

