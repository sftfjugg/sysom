from django.urls import path
from django.urls.conf import include
from django.conf import settings

from rest_framework.routers import DefaultRouter

from apps.vmcore import views

router = DefaultRouter()
router.register('issue', views.IssueModelViewSet)
router.register('', views.VmcoreViewSet)

urlpatterns = [
    path(f'{settings.VMCORE_SERVICE_INTERFACE_PREFIX}vmcore_detail/',
         views.VmcoreDetail.as_view()),
    path(f'{settings.VMCORE_SERVICE_INTERFACE_PREFIX}vmcore_config_test/',
         views.VmcoreConfigTest.as_view()),
    path(settings.VMCORE_SERVICE_INTERFACE_PREFIX, include(router.urls)),
]
