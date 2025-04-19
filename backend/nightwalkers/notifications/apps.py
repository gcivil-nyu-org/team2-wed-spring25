from django.apps import AppConfig
import os
from django.conf import settings


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        # Only verify file existence, don't initialize services
        if not os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            raise ValueError(
                f"Firebase credentials not found at \
                             {settings.FIREBASE_CREDENTIALS_PATH}"
            )
