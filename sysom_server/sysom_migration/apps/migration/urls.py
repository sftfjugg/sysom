from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from apps.migration import views

router = DefaultRouter()

router.register('implementation', views.MigImpView)

urlpatterns = [
    path('api/v1/migration/group/', views.MigImpView.as_view({'get': 'get_group'})),
    re_path('^api/v1/implementation/list/$', views.MigImpView.as_view({'get': 'get_group_list'})),
    re_path('^api/v1/implementation/info/$', views.MigImpView.as_view({'get': 'get_host_info'})),
    re_path('^api/v1/implementation/log/$', views.MigImpView.as_view({'get': 'get_host_log'})),
    re_path('^api/v1/implementation/report/$', views.MigImpView.as_view({'get': 'get_host_report'})),
    path('api/v1/implementation/migrate/', views.MigImpView.as_view({'post': 'post_host_migrate'})),
    path('api/v1/implementation/stop/', views.MigImpView.as_view({'post': 'post_host_stop'})),
    path('api/v1/implementation/reboot/', views.MigImpView.as_view({'post': 'post_host_reboot'})),
    path('api/v1/', include(router.urls))
]
