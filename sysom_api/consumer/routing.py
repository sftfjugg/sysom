from django.urls import path
from channels.routing import URLRouter
from .consumers import SshConsumer
from .middleware import AuthMiddleware

ws_router = AuthMiddleware(
    URLRouter([
        path('ws/ssh/', SshConsumer.as_asgi()),
    ])
)
