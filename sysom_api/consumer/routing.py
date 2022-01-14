from django.urls import path
from channels.routing import URLRouter
from .consumers import *
from .middleware import AuthMiddleware

ws_router = AuthMiddleware(
    URLRouter([
        path('ws/ssh/<int:id>/', SshConsumer.as_asgi()),
    ])
)
