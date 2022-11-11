"""
ASGI config for sysom project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sysom.settings')

from channels.routing import ProtocolTypeRouter
from django.core.asgi import get_asgi_application
from consumer.routing import ws_router


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": ws_router
    })
