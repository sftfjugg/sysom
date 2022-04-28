from django.urls import path
from django.urls.conf import include

from rest_framework.routers import DefaultRouter

from apps.alarm import views

router = DefaultRouter()
router.register('alarm', views.AlarmAPIView)
router.register('subscribe', views.SubAPIView)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/get_user_alarm/', views.AlarmAPIView.as_view({'get': 'get_user_alarm'})),
]
