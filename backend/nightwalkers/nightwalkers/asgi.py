import os

# import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# from channels.security.websocket import AllowedHostsOriginValidator
from chat.routing import websocket_urlpatterns
from django.conf import settings

# Set the default settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nightwalkers.settings")
django_asgi_app = get_asgi_application()
# django.setup()  # This is crucial!

# Ensure settings are configured before proceeding


if not settings.configured:
    settings.configure()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
