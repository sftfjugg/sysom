from django.urls import path
from django.urls.conf import include

from rest_framework.routers import DefaultRouter

from apps.alarm import views

router = DefaultRouter()
router.register('alarm', views.AlarmAPIView)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
