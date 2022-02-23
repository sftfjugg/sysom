from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register('user', views.UserModelViewSet)
router.register('role', views.RoleModelViewSet)
router.register('permission', views.PermissionViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', views.AuthAPIView.as_view()),
    path('api/v1/user/logs', views.UserModelViewSet.as_view({'get': 'get_logs'})),
    path('api/v1/change_password/', views.ChangePasswordViewSet.as_view())
]
