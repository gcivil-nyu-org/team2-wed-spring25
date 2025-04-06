# # # nightwalkers/asgi.py
# import os
# import django
# from django.core.asgi import get_asgi_application

# # Configure settings before any imports
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nightwalkers.settings')
# django.setup()

# # Then import other modules
# from channels.routing import ProtocolTypeRouter, URLRouter
# from chat.routing import websocket_urlpatterns

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": URLRouter(websocket_urlpatterns),
# })

# nightwalkers/asgi.py
import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from chat.routing import websocket_urlpatterns

# Set the default settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nightwalkers.settings")
django.setup()  # This is crucial!

# Ensure settings are configured before proceeding
from django.conf import settings
if not settings.configured:
    settings.configure()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(websocket_urlpatterns),
})