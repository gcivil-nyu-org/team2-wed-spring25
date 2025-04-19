import firebase_admin
from firebase_admin import messaging
from django.conf import settings
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import asyncio
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Load from environment variables
FIREBASE_CONFIG = {
    "type": "service_account",
    "project_id": os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    "private_key_id": os.getenv("NEXT_PUBLIC_FIREBASE_PRIVATE_KEY_ID"),
    "private_key": os.getenv("NEXT_PUBLIC_FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
    "client_email": os.getenv("NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL"),
    "client_id": os.getenv("NEXT_PUBLIC_FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv("NEXT_PUBLIC_FIREBASE_CERT_URL"),
    "universe_domain": "googleapis.com",
}

CREDS_PATH = BASE_DIR / "firebase-credentials.json"
with open(CREDS_PATH, "w") as f:
    json.dump(FIREBASE_CONFIG, f)
FIREBASE_CREDENTIALS_PATH = CREDS_PATH


class NotificationService:
    _initialized = False

    def __init__(self):
        if not self._initialized:
            self._initialize()

    def _initialize(self):
        if not firebase_admin._apps:
            cred = firebase_admin.credentials.Certificate(
                settings.FIREBASE_CREDENTIALS_PATH
            )
            firebase_admin.initialize_app(cred)
        self.User = None  # Will be loaded lazily
        self._initialized = True

    def _get_user_model(self):
        if self.User is None:
            self.User = get_user_model()
        return self.User

    async def asend_to_user(self, user_id, title, body, data=None):
        """Async version of send_to_user"""
        try:
            User = self._get_user_model()
            user = await sync_to_async(User.objects.get)(id=user_id)
            if not user.fcm_token:
                return False

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=user.fcm_token,
            )

            # Run synchronous FCM send in thread pool
            return await asyncio.to_thread(messaging.send, message)
        except Exception as e:
            print(f"Async notification error: {str(e)}")
            return False

    def send_to_user(self, user_id, title, body, data=None):
        """Synchronous version"""
        try:
            User = self._get_user_model()
            user = User.objects.get(id=user_id)
            if not user.fcm_token:
                return False

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=user.fcm_token,
            )
            messaging.send(message)
            return True
        except Exception as e:
            print(f"Notification error: {str(e)}")
            return False

    async def abroadcast_to_users(self, user_ids, title, body, data=None):
        """Async version of broadcast"""
        try:
            User = self._get_user_model()

            # Async ORM query
            tokens = await sync_to_async(list)(
                User.objects.filter(
                    id__in=user_ids, fcm_token__isnull=False
                ).values_list("fcm_token", flat=True)
            )

            if not tokens:
                return 0

            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=tokens,
            )

            # Run synchronous FCM send in thread pool
            response = await asyncio.to_thread(messaging.send_multicast, message)
            return response.success_count
        except Exception as e:
            print(f"Async broadcast error: {str(e)}")
            return 0

    def broadcast_to_users(self, user_ids, title, body, data=None):
        """Synchronous version"""
        try:
            User = self._get_user_model()

            tokens = list(
                User.objects.filter(
                    id__in=user_ids, fcm_token__isnull=False
                ).values_list("fcm_token", flat=True)
            )

            if not tokens:
                return 0

            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=tokens,
            )
            response = messaging.send_multicast(message)
            return response.success_count
        except Exception as e:
            print(f"Broadcast error: {str(e)}")
            return 0


notification_service = NotificationService()
