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

router.register('tasks', views.TaskAPIView)

urlpatterns = [
    path('api/v1/tasks/offline_import/', views.TaskAPIView.as_view({'post': 'offline_import'})),
    path('api/v1/', include(router.urls)),
    path('api/v2/tasks/', views.TaskAPIView.as_view({'post': 'create_task_v2'})),
    re_path('^api/v1/tasks/(?P<task_id>[a-zA-Z0-9]+)/(?P<etx>[a-zA-Z]+)/$', views.TaskAPIView.as_view({'get': 'get_task_svg'})),
]
