# chat/serializers.py
from rest_framework import serializers
from chat.models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'read', 'sender_id']