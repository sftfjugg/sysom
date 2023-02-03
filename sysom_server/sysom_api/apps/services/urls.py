# -*- coding: utf-8 -*- #
"""
Time                2022/11/29 15:12
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                tests.py
Description:
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.services import views

router = DefaultRouter()

router.register('services', views.ServicesAPIView)

urlpatterns = [
    path('api/v1/', include(router.urls))
]
