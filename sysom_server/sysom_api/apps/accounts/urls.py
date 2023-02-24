from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register('user', views.UserModelViewSet)
router.register('role', views.RoleModelViewSet)
router.register('permission', views.PermissionViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', views.AccountAuthView.as_view({'post': 'login'})),
    path('api/v1/logout/', views.AccountAuthView.as_view({'get': 'logout'})),
    path('api/v1/journal/', views.UserModelViewSet.as_view({'get': 'get_logs'})),
    path('api/v1/response_code/', views.UserModelViewSet.as_view({'get': 'get_response_code'})),
    path('api/v1/user_info/', views.UserModelViewSet.as_view({'get': 'get_user_info'})),
    path('api/v1/change_password/', views.PasswordViewSet.as_view({'post': 'change_password'})),
    path('api/v1/reset_password/', views.PasswordViewSet.as_view({'post': 'reset_password'})),
]
