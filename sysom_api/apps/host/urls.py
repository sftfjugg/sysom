from django.urls import path, re_path
from django.urls.conf import include

from rest_framework.routers import DefaultRouter

from apps.host import views

router = DefaultRouter()
router.register('host', views.HostModelViewSet)
router.register('cluster', views.ClusterViewSet)

urlpatterns = [
    path('api/v1/host/upload_file/', views.SaveUploadFile.as_view()),
    path('api/v1/host/batch_add/', views.HostModelViewSet.as_view({'post': 'batch_add_host'})),
    path('api/v1/host/batch_export/', views.HostModelViewSet.as_view({'post': 'batch_export_host'})),
    path('api/v1/host/batch_del/', views.HostModelViewSet.as_view({'post': 'batch_del_host'})),
    re_path(r'^api/v1/host/del/(?P<host_ip>.*)/$', views.HostModelViewSet.as_view({'delete': 'del_host'})),
    re_path(r'^api/v1/host/update/(?P<host_ip>.*)/$', views.HostModelViewSet.as_view({'patch': 'patch_host'})),
    path('api/v1/', include(router.urls)),
]
