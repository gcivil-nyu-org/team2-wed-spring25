# chat/serializers.py
from rest_framework import serializers
from chat.models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender = (
        serializers.StringRelatedField()
    )  # For displaying sender's string representation
    sender_id = serializers.SerializerMethodField()  # Better way to get sender ID

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_id", "content", "timestamp", "read"]

    def get_sender_id(self, obj):
        return obj.sender.id  # Directly access the sender's ID
