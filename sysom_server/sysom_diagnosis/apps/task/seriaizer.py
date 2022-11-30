# -*- encoding: utf-8 -*-
"""
@File    : seriaizer.py
@Time    : 2021/11/22 17:41
@Author  : DM
@Software: PyCharm
"""
import json
from rest_framework import serializers
from apps.task.models import JobModel


class BaseJobSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['params'] = json.loads(data['params'])
        if isinstance(data.get('result', None), str):
            try:
                data['result'] = json.loads(data['result'])
            except:
                pass
        return data


class JobListSerializer(BaseJobSerializer):
    class Meta:
        model = JobModel
        exclude = ('host_by', 'command', 'result')


class JobRetrieveSerializer(BaseJobSerializer):
    class Meta:
        model = JobModel
        exclude = ('host_by', 'command')


class JobDetailSerializer(BaseJobSerializer):
    class Meta:
        model = JobModel
        fields = '__all__'
