#!/usr/bin/env python
# -*- coding: utf-8 -*-
from rest_framework.filters import BaseFilterBackend
from rest_framework.request import Request
from apps.task.models import JobModel


class TaskFilter(BaseFilterBackend):
    def filter_queryset(self, request: Request, queryset, view):
        params = request.query_params.dict()
        service_name = params.get('service_name', None)
        if service_name:
            service_name_all = '"service_name"'+': '+'"%s"' % service_name
            print(service_name_all)
            queryset = queryset.filter(params__contains=service_name_all)
        return queryset
