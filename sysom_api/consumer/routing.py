from django.urls import path
from channels.routing import URLRouter
from .consumers import *
from .middleware import AuthMiddleware

ws_router = AuthMiddleware(
    URLRouter([
        path('ws/exec/<str:token>/', ExecConsumer.as_asgi()),
        path('ws/ssh/<int:id>/', SshConsumer.as_asgi()),
    ])
)
