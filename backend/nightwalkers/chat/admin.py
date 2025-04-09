from django.contrib import admin
from .models import Chat, Message


class ChatAdmin(admin.ModelAdmin):
    list_display = (
        "uuid",
        "user1",
        "user2",
        "created_at",
    )


admin.site.register(Chat, ChatAdmin)


class MessageAdmin(admin.ModelAdmin):
    list_display = ("chat", "sender", "content", "timestamp", "read")


admin.site.register(Message, MessageAdmin)
