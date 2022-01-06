# -*- encoding: utf-8 -*-
"""
@File    : urls.py
@Time    : 2021/11/2 11:07
@Author  : DM
@Software: PyCharm
"""

from django.urls import path, re_path
from apps.monitor import views

urlpatterns = [
    path('api/v1/svg_info/', views.SvgInfoAPIView.as_view()),
    re_path(r'^api/v1/download/svg/(?P<svg_name>.*?)$', views.DownloadSvgView.as_view())
]
