"""
ASGI config for sysom project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sysom.settings')
import django
django.setup()
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from consumer.consumers import SshConsumer
from consumer.middleware import AuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddleware(
        URLRouter([
            path('ws/ssh/<int:id>/', SshConsumer.as_asgi()),
        ])
    )
})
