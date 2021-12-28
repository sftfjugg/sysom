"""
ASGI config for sysom project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""
import os
from channels.routing import ProtocolTypeRouter

from consumer import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sysom.settings')

application = ProtocolTypeRouter({
    "websocket": routing.ws_router,
})
