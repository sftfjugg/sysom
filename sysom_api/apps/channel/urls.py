from django.urls import path
from .views import ChannelAPIView

urlpatterns = [
    path('api/v1/channel/', ChannelAPIView.as_view({'post': 'channel_post'})),
    path('api/v1/channel/validate/', ChannelAPIView.as_view({'post': 'validate_host_channel'})),
    path('api/v1/channel/exec_result/', ChannelAPIView.as_view({'post': 'get_exec_result'})),
]
