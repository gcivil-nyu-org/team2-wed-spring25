from django.urls import path
from . import views

urlpatterns = [
    # Post endpoints
    path("send/", views.send_notification, name="send_notification"),
]