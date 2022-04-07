# -*- encoding: utf-8 -*-
"""
@File    : urls.py
@Time    : 2022/2/10 下午1:49
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
from django.urls import path,include
from rest_framework.routers import DefaultRouter

from apps.vul import views

router = DefaultRouter()
router.register(r'vul-config', views.VulAddrViewSet)
urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/vul/hist/', views.SaFixHistListView.as_view()),
    path('api/v1/vul/hist/<int:pk>/<str:hostname>/', views.SaFixHistDetailHostView.as_view()),
    path('api/v1/vul/hist/<int:pk>/', views.SaFixHistDetailsView.as_view()),
    path('api/v1/vul/summary/', views.VulSummaryView.as_view()),
    path('api/v1/vul/updatesa/', views.UpdateSaView.as_view()),
    path('api/v1/vul/', views.VulListView.as_view()),
    path('api/v1/vul/<str:cve_id>/', views.VulDetailsView.as_view()),
]
