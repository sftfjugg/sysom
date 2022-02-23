#!/usr/bin/env python
# -*- coding: utf-8 -*-
from rest_framework.filters import BaseFilterBackend
from rest_framework.request import Request
from apps.task.models import JobModel


class TaskFilter(BaseFilterBackend):
    def filter_queryset(self, request: Request, queryset, view):
        params = request.query_params.dict()
        queryset_all = JobModel.objects.all()
        search = params.get("search", None)
        if search:
            queryset = queryset | queryset_all.filter(params__contains=search)
            queryset = queryset | queryset_all.filter(host_by__contains=search)
        service_name = params.get('service_name', None)
        if service_name:
            queryset = queryset.filter(params__contains=service_name)
        host_by = params.get('host_by', None)
        if host_by:
            queryset = queryset.filter(host_by__contains=host_by)
        return queryset
