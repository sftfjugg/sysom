# -*- coding: utf-8 -*- #
"""
Time                2022/11/29 15:12
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                views.py
Description:
"""

from rest_framework import mixins
from apps.common.common_model_viewset import CommonModelViewSet
from lib.response import success
from apps.accounts.authentication import Authentication
from apps.services import serializer
from apps.services.models import ServiceInfo


class ServicesAPIView(CommonModelViewSet,
                      mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,):
    """ Services view set used to manage microservices """
    queryset = ServiceInfo.objects.all()
    authentication_classes = [Authentication]
    serializer_class = serializer.ServiceInfoSerializer
    http_method_names = ['get', 'post']
    
    def get_authenticators(self):
        if self.request.method.lower() == "get":
            return []
        else:
            return [auth() for auth in self.authentication_classes]
    
    def create(self, request, *args, **kwargs):
        service_info_serializer = serializer.ServiceInfoSerializer(data=request.data)
        service_info_serializer.is_valid(raise_exception=True)
        service_info_serializer.save()
        return success(result=self.get_serializer(service_info_serializer.instance).data, message="Insert success")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return success([])
        return success(result=self.get_serializer(instance).data)
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(ServicesAPIView, self).list(request, *args, **kwargs)
