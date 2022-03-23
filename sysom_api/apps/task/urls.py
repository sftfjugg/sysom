# -*- encoding: utf-8 -*-
"""
@File    : urls.py
@Time    : 2021/11/22 10:38
@Author  : DM
@Software: PyCharm
"""
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from apps.task import views

router = DefaultRouter()

router.register('jobs', views.JobAPIView)
router.register('tasks', views.TaskAPIView)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    re_path('^api/v1/tasks/(?P<task_id>\d+)/(?P<etx>[a-zA-Z]+)/$', views.TaskAPIView.as_view({'get': 'get_task_svg'})),
]
