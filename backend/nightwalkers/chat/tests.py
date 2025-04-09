from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.urls import reverse  # Import reverse
from chat.models import Chat, Message
import uuid
import json

User = get_user_model()

class ChatViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create test users with your custom User model
        self.user1 = User.objects.create_user(
            email="user1@example.com",
            password="testpass123",
            first_name="User1",
            last_name="Test",
            karma=50
        )
        self.user2 = User.objects.create_user(
            email="user2@example.com",
            password="testpass123",
            first_name="User2",
            last_name="Test",
            karma=50
        )
        
        # Make them follow each other to be mutual follows
        self.user1.following.add(self.user2)
        self.user2.following.add(self.user1)
        
        # Create a chat between them
        self.chat = Chat.objects.create(user1=self.user1, user2=self.user2)
        
        # Create some messages
        Message.objects.create(chat=self.chat, sender=self.user1, content="Hello")
        Message.objects.create(chat=self.chat, sender=self.user2, content="Hi there", read=False)
    
    def test_get_mutual_follows_with_chats(self):
        url = reverse("get_mutual_follows_with_chats", kwargs={"user_id": self.user1.id})
        response = self.client.get(url)
        
        # Check status code first
        self.assertEqual(response.status_code, 200)
        
        # Parse JSON response
        try:
            data = response.json()
        except ValueError:
            self.fail("Response is not valid JSON")
        
        # Check response structure
        self.assertTrue('data' in data)
        
        # Should return one mutual follow (user2)
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['user']['email'], 'user2@example.com')
        self.assertEqual(data['data'][0]['chat_uuid'], str(self.chat.uuid))
        self.assertEqual(len(data['data'][0]['messages']), 2)
        self.assertEqual(data['data'][0]['unread_count'], 1)  # One unread message from user2
    
    def test_read_user_messages(self):
        url = reverse("read_user_messages", kwargs={"chat_uuid": self.chat.uuid, "sender_id": self.user2.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 200)
        
        # Check if messages were marked as read
        unread_count = Message.objects.filter(
            chat=self.chat, 
            sender=self.user2, 
            read=False
        ).count()
        self.assertEqual(unread_count, 0)
    
    def test_read_user_messages_invalid_chat(self):
        invalid_uuid = uuid.uuid4()
        url = reverse("read_user_messages", kwargs={"chat_uuid": invalid_uuid, "sender_id": self.user2.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, 404)
        
        # Check error message
        try:
            error_data = response.json()
            self.assertEqual(error_data['error'], 'Chat not found')
        except ValueError:
            self.fail("Response is not valid JSON")
    
    def test_get_mutual_follows_user_not_found(self):
        invalid_user_id = 9999
        url = reverse("get_mutual_follows_with_chats", kwargs={"user_id": invalid_user_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 404)
        
        # Check error message
        try:
            error_data = response.json()
            self.assertEqual(error_data['error'], 'User not found')
        except ValueError:
            self.fail("Response is not valid JSON")
    
    def test_chat_ordering_consistency(self):
        # Test that chat ordering is consistent regardless of user order
        chat1, created1 = Chat.objects.get_or_create_chat(self.user1, self.user2)
        chat2, created2 = Chat.objects.get_or_create_chat(self.user2, self.user1)
        
        self.assertEqual(chat1.id, chat2.id)
        self.assertFalse(created2)  # Should not create a new chat
    
    def test_no_mutual_follows(self):
        # Create a third user who isn't mutual follows with user1
        user3 = User.objects.create_user(
            email="user3@example.com",
            password="testpass123",
            first_name="User3",
            last_name="Test",
            karma=50
        )
        
        # user1 follows user3 but user3 doesn't follow back
        self.user1.following.add(user3)
        
        url = reverse("get_mutual_follows_with_chats", kwargs={"user_id": self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        
        try:
            data = response.json()
        except ValueError:
            self.fail("Response is not valid JSON")
        
        # Should only return mutual follows (user2), not user3
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['user']['email'], 'user2@example.com')
