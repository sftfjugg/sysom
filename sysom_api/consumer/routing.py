from django.urls import path
from channels.routing import URLRouter
from .consumers import SshConsumer, NoticelconConsumer
from .middleware import AuthMiddleware

ws_router = AuthMiddleware(
    URLRouter([
        path('ws/ssh/', SshConsumer.as_asgi()),
        path('ws/noticelcon/', NoticelconConsumer.as_asgi()),
    ])
)
