from django.urls import path,re_path
from django.urls.conf import include

from rest_framework.routers import DefaultRouter

from apps.vmcore import views

router = DefaultRouter()
router.register('vmcore', views.VmcoreViewSet)
router.register('issue', views.IssueModelViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/vmcore_detail/', views.VmcoreDetail.as_view()),
    path('api/v1/vmcore_config_test/', views.VmcoreConfigTest.as_view()),
]
