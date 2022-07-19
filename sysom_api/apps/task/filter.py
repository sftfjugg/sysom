#!/usr/bin/python3
# -*- coding: utf-8 -*-
import django_filters
from apps.task.models import JobModel

class TaskFilter(django_filters.FilterSet):
    service_name = django_filters.CharFilter(field_name='params__service_name')

    class Meta:
        model = JobModel
        fields = ['id', 'task_id', 'created_by__id', 'status']
