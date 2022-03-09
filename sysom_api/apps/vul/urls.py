# -*- encoding: utf-8 -*-
"""
@File    : urls.py
@Time    : 2022/2/10 下午1:49
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
from django.urls import path
from apps.vul import views

urlpatterns = [
    path('api/v1/vul/hist/', views.SaFixHistListView.as_view()),
    path('api/v1/vul/hist/<int:pk>/<str:hostname>/', views.SaFixHistDetailHostView.as_view()),
    path('api/v1/vul/hist/<int:pk>/', views.SaFixHistDetailsView.as_view()),
    path('api/v1/vul/summary/', views.VulSummaryView.as_view()),
    path('api/v1/vul/', views.VulListView.as_view()),
    path('api/v1/vul/<str:cve_id>/', views.VulDetailsView.as_view()),
]
