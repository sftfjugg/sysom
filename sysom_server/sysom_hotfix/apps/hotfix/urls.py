from django.urls import path
from django.urls.conf import include

from rest_framework.routers import DefaultRouter

from apps.hotfix import views

router = DefaultRouter()
router.register('hotfix', views.HotfixAPIView)

urlpatterns = [
    path('api/v1/hotfix/create_hotfix/', views.HotfixAPIView.as_view({'post': 'create_hotfix'})),
    path('api/v1/hotfix/get_hotfix_list/', views.HotfixAPIView.as_view({'get': 'get_hotfixlist'})),
    path('api/v1/hotfix/get_formal_hotfix_list/', views.HotfixAPIView.as_view({'get': 'get_formal_hotfixlist'})),
    path('api/v1/hotfix/delete_hotfix/', views.HotfixAPIView.as_view({'delete': 'delete_hotfix'})),
    path('api/v1/hotfix/set_formal/', views.HotfixAPIView.as_view({'post': 'set_formal'})),
    path('api/v1/hotfix/upload_patch/', views.SaveUploadFile.as_view()),
    path('api/v1/hotfix/update_building_status/', views.HotfixAPIView.as_view({'post': 'update_building_status'})),
    path('api/v1/hotfix/insert_building_log/', views.HotfixAPIView.as_view({'post': 'insert_building_log'})),
    path('api/v1/hotfix/get_build_log/', views.HotfixAPIView.as_view({'get': 'get_build_log'})),
    path('api/v1/hotfix/sync_building_log/', views.HotfixAPIView.as_view({'post': 'sync_build_log'})),
    path('api/v1/hotfix/update_hotfix_name/', views.HotfixAPIView.as_view({'post': 'update_hotfix_name'})),
    path('api/v1/hotfix/download_hotfix/', views.HotfixAPIView.as_view({'get': 'download_hotfix_file'})),
    path('api/v1/', include(router.urls)),
]
