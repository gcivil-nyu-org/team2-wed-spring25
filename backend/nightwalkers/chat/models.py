# chat/models.py
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ChatManager(models.Manager):
    def get_or_create_chat(self, user1, user2):
        """
        Gets or creates a chat between two users, ensuring consistent ordering
        """
        user_ids = sorted([user1.id, user2.id])
        chat, created = self.get_or_create(
            user1_id=user_ids[0],
            user2_id=user_ids[1],
            defaults={"user1_id": user_ids[0], "user2_id": user_ids[1]},
        )
        return chat, created


class Chat(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user1 = models.ForeignKey(
        User, related_name="chats_as_user1", on_delete=models.CASCADE
    )
    user2 = models.ForeignKey(
        User, related_name="chats_as_user2", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ChatManager()  # Assign the custom manager

    class Meta:
        unique_together = ("user1", "user2")

    def __str__(self):
        return f"Chat between {self.user1} and {self.user2}"


class Message(models.Model):
    chat = models.ForeignKey(Chat, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    is_deleted = models.TextField(default="no")  # no, self, everyone

    class Meta:
        ordering = ["timestamp"]
