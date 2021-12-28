# -*- encoding: utf-8 -*-
"""
@File    : urls.py
@Time    : 2021/11/22 10:38
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.task import views

router = DefaultRouter()

router.register('jobs', views.JobAPIView)
router.register('tasks', views.TaskAPIView)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
