from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from apps.migration import views

router = DefaultRouter()

router.register('assessment', views.MigAssView)
router.register('implementation', views.MigImpView)

urlpatterns = [
    path('api/v1/assessment/host/', views.MigAssView.as_view({'get': 'get_host'})),
    path('api/v1/assessment/list/', views.MigAssView.as_view({'get': 'get_ass_list'})),
    re_path('^api/v1/assessment/imp/$', views.MigAssView.as_view({'get': 'get_ass_imp'})),
    re_path('^api/v1/assessment/sys/$', views.MigAssView.as_view({'get': 'get_ass_sys'})),
    re_path('^api/v1/assessment/hard/$', views.MigAssView.as_view({'get': 'get_ass_hard'})),
    re_path('^api/v1/assessment/app/$', views.MigAssView.as_view({'get': 'get_ass_app'})),
    path('api/v1/assessment/start/', views.MigAssView.as_view({'post': 'post_ass_start'})),
    path('api/v1/assessment/stop/', views.MigAssView.as_view({'post': 'post_ass_stop'})),
    path('api/v1/assessment/retry/', views.MigAssView.as_view({'post': 'post_ass_retry'})),

    path('api/v1/migration/group/', views.MigImpView.as_view({'get': 'get_group'})),
    re_path('^api/v1/implementation/list/$', views.MigImpView.as_view({'get': 'get_group_list'})),
    re_path('^api/v1/implementation/info/$', views.MigImpView.as_view({'get': 'get_host_info'})),
    re_path('^api/v1/implementation/mig/$', views.MigImpView.as_view({'get': 'get_host_mig'})),
    re_path('^api/v1/implementation/log/$', views.MigImpView.as_view({'get': 'get_host_log'})),
    path('api/v1/implementation/migrate/', views.MigImpView.as_view({'post': 'post_host_migrate'})),

    path('api/v1/', include(router.urls))
]
