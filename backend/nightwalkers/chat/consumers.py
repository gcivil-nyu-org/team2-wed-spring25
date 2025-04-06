# chat/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import json

# Add at the top of consumers.py
online_users = set()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the User model at runtime
        User = get_user_model()

        # Extract user_id from the URL query parameter
        self.user_id = self.scope["url_route"]["kwargs"].get("user_id")
        if not self.user_id:
            await self.close()
            return

        # Convert user_id to integer and validate user exists
        try:
            self.user = await database_sync_to_async(User.objects.get)(id=self.user_id)
            print(f"User {self.user.email} connected.")
        except User.DoesNotExist:
            await self.close()
            return

        # Group name for broadcasting to all users
        self.global_group_name = "global_chat"
        self.user_group_name = f"user_{self.user_id}"

        online_users.add(self.user_id)

        # Add user to groups
        await self.channel_layer.group_add(self.global_group_name, self.channel_name)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)


        # Accept the WebSocket connection
        await self.accept()

        # Broadcast that this user is online
        await self.channel_layer.group_send(
            self.global_group_name,
            {
                "type": "status_update",
                "user_id": self.user_id,
                "is_online": True,
            }
        )

        #send the current user list of all online users
        await self.send(text_data=json.dumps({
            "type": "user_list",
            "users": list(online_users),
        }))

    async def disconnect(self, close_code):
        if hasattr(self, "user_id") and self.user_id in online_users: 
            # Remove user from groups
            await self.channel_layer.group_discard(self.global_group_name, self.channel_name)
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

            # Broadcast that this user is offline
            await self.channel_layer.group_send(
                self.global_group_name,
                {
                    "type": "status_update",
                    "user_id": self.user_id,
                    "is_online": False,
                }
            )

            online_users.remove(self.user_id)

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'chat_message':
            await self.handle_chat_message(data)
        elif data['type'] == 'mark_messages_read':
            await self.handle_mark_messages_read(data)

    async def handle_chat_message(self, data):
        recipient_id = data['recipient_id']
        content = data['content']
        
        # Save message to database
        message = await self.save_message(recipient_id, content)
        # Check if recipient is online
        is_online = await self.is_user_online(recipient_id)
        #print all above
        
        if is_online:
            # Send message directly to recipient
            await self.channel_layer.group_send(
                f"user_{recipient_id}",
                {
                    "type": "chat_message",
                    "message": content,
                    "sender_id": self.user_id,
                    "timestamp": str(message.timestamp),
                    "message_id": str(message.id)
                }
            )
        
        # Send delivery confirmation to sender
        await self.send(text_data=json.dumps({
            "type": "message_delivery",
            "message_id": str(message.id),
            "status": "delivered" if is_online else "stored",
            "timestamp": str(message.timestamp)
        }))

    @database_sync_to_async
    def save_message(self, recipient_id, content):
        User = get_user_model()
        from .models import Chat, Message  # Move import here
        
        recipient = User.objects.get(id=recipient_id)
        
        #always take the user with smalelr id as user1 and the other as user2
        if self.user.id < recipient.id:
            user1 = self.user
            user2 = recipient
        else:
            user1 = recipient
            user2 = self.user

        # Get or create chat
        
        chat, created = Chat.objects.get_or_create(user1=user1, user2=user2)

        # Create message
        return Message.objects.create(
            chat=chat,
            sender=self.user,
            content=content
        )

    @database_sync_to_async
    def is_user_online(self, user_id):
        return str(user_id) in online_users

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "status",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
            "sender_id": event["sender_id"],
            "timestamp": event["timestamp"],
            "message_id": event["message_id"]
        }))

    async def handle_mark_messages_read(self, data):
        """
        Marks all unread messages from a specific sender in a chat as read
        """
        chat_uuid = data['chat_uuid']
        sender_id = data['sender_id']
        current_user_id = data['current_user_id']
        
        # Validate the current user is part of this chat
        if str(self.user_id) != str(current_user_id):
            print(f"User {self.user_id} is not authorized to mark messages as read in chat {chat_uuid}.")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Unauthorized to mark messages as read"
            }))
            return
        
        # Mark messages as read in the database
        from .models import Chat, Message
        chat = await database_sync_to_async(Chat.objects.get)(uuid=chat_uuid)
        await database_sync_to_async(Message.objects.filter)(
            chat=chat,
            sender__id=sender_id,
            is_read=False
        ).update(is_read=True)
        
        # Notify the sender that their messages were read (if online)
        await self.channel_layer.group_send(
            f"user_{sender_id}",
            {
                "type": "messages_read_notification",
                "chat_uuid": chat_uuid,
                "reader_id": current_user_id,
            }
        )


    async def messages_read_notification(self, event):
        """
        Notifies a user that their messages were read by someone
        """
        await self.send(text_data=json.dumps({
            "type": "messages_read",
            "chat_uuid": event["chat_uuid"],
            "reader_id": event["reader_id"],
        }))