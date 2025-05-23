from django.urls import path
from . import views

urlpatterns = [
    path(
        "<int:user_id>/",
        views.get_mutual_follows_with_chats,
        name="get_mutual_follows_with_chats",
    ),
    path(
        "<uuid:chat_uuid>/read/<int:sender_id>/",
        views.read_user_messages,
        name="read_user_messages",
    ),
    # path("<uuid:chat_uuid>/<id:message_id>", views.get_chat, name="get_chat"),
    path("chat/<int:message_id>/delete/", views.delete_message, name="delete_message"),
    path("chat/message/<int:message_id>/", views.edit_message, name="edit_message"),
]
