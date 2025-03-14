from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from unittest.mock import patch, MagicMock

User = get_user_model()


class UserModelTests(TestCase):
    """Tests for the custom User model"""

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.first_name, "Test")
        self.assertEqual(user.last_name, "User")
        self.assertTrue(user.check_password("testpass123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_admin)
        self.assertTrue(user.is_active)
        self.assertFalse(user.email_verified)

    def test_create_user_no_email(self):
        """Test creating a user without email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email=None, password="testpass123", first_name="Test", last_name="User"
            )

    def test_create_user_no_first_name(self):
        """Test creating a user without first name raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email="test@example.com",
                password="testpass123",
                first_name=None,
                last_name="User",
            )

    def test_create_user_no_last_name(self):
        """Test creating a user without last name raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email="test@example.com",
                password="testpass123",
                first_name="Test",
                last_name=None,
            )

    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )
        self.assertEqual(user.email, "admin@example.com")
        self.assertEqual(user.first_name, "Admin")  # Default value for superuser
        self.assertEqual(user.last_name, "User")  # Default value for superuser
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_admin)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)

    def test_user_str_method(self):
        """Test the string representation of user"""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        self.assertEqual(str(user), f"Test User (test@example.com)")

    def test_get_avatar_with_uploaded_avatar(self):
        """Test get_avatar property with uploaded avatar"""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        # We need to mock the avatar url
        user.avatar = MagicMock()
        user.avatar.url = "/media/avatars/test.jpg"
        self.assertEqual(user.get_avatar, "/media/avatars/test.jpg")

    def test_get_avatar_with_avatar_url(self):
        """Test get_avatar property with avatar_url"""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
            avatar_url="https://example.com/avatar.jpg",
        )
        self.assertEqual(user.get_avatar, "https://example.com/avatar.jpg")

    def test_get_avatar_without_avatar(self):
        """Test get_avatar property without any avatar"""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        self.assertIsNone(user.get_avatar)


class AuthViewsTests(APITestCase):
    """Tests for authentication views"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.profile_url = reverse("user-profile")

        # Create a test user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

    def test_register_view_success(self):
        """Test successful user registration"""
        data = {
            "email": "newuser@example.com",
            "password": "Password123!",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)

    def test_register_view_missing_fields(self):
        """Test registration with missing required fields"""
        data = {
            "email": "newuser@example.com",
            "password": "Password123!",
            # Missing first_name and last_name
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_view_existing_email(self):
        """Test registration with an existing email"""
        data = {
            "email": "test@example.com",  # Already exists
            "password": "Password123!",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_view_success(self):
        """Test successful login"""
        data = {"email": "test@example.com", "password": "testpass123"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)

    def test_login_view_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {"email": "test@example.com", "password": "wrongpassword"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_view_missing_fields(self):
        """Test login with missing fields"""
        data = {
            "email": "test@example.com"
            # Missing password
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_view_success(self):
        """Test successful logout"""
        # First login to get a token
        login_data = {"email": "test@example.com", "password": "testpass123"}
        login_response = self.client.post(self.login_url, login_data, format="json")
        refresh_token = login_response.data["refresh"]

        # Then logout
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        data = {"refresh": refresh_token}
        response = self.client.post(self.logout_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_view_unauthenticated(self):
        """Test logout without authentication"""
        response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_view_authenticated(self):
        """Test accessing profile when authenticated"""
        # First login to get a token
        login_data = {"email": "test@example.com", "password": "testpass123"}
        login_response = self.client.post(self.login_url, login_data, format="json")

        # Then access profile
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")
        self.assertEqual(response.data["first_name"], "Test")
        self.assertEqual(response.data["last_name"], "User")

    def test_profile_view_unauthenticated(self):
        """Test accessing profile without authentication"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GoogleAuthViewTests(APITestCase):
    """Tests for Google Auth view"""

    def setUp(self):
        self.client = APIClient()
        self.google_auth_url = reverse("google-auth")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_success(self, mock_verify):
        """Test successful Google authentication"""
        # Mock the Google token verification
        mock_verify.return_value = {
            "email": "google@example.com",
            "sub": "12345",
            "given_name": "Google",
            "family_name": "User",
            "picture": "https://example.com/avatar.jpg",
        }

        data = {
            "token": "fake-google-token",
            "email": "google@example.com",
            "name": "Google User",
        }

        response = self.client.post(self.google_auth_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)

        # Check that user was created with proper data
        user = User.objects.get(email="google@example.com")
        self.assertEqual(user.first_name, "Google")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.provider, "google")
        self.assertEqual(user.provider_id, "12345")
        self.assertTrue(user.email_verified)
        self.assertEqual(user.avatar_url, "https://example.com/avatar.jpg")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_update_existing_user(self, mock_verify):
        """Test Google auth updates existing user"""
        # Create a user with the same email
        user = User.objects.create_user(
            email="google@example.com",
            password="testpass123",
            first_name="Old",
            last_name="Name",
        )

        # Mock the Google token verification
        mock_verify.return_value = {
            "email": "google@example.com",
            "sub": "12345",
            "given_name": "Google",
            "family_name": "User",
            "picture": "https://example.com/avatar.jpg",
        }

        data = {
            "token": "fake-google-token",
            "email": "google@example.com",
            "name": "Google User",
        }

        response = self.client.post(self.google_auth_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Google")
        self.assertEqual(user.last_name, "User")
        self.assertEqual(user.provider, "google")
        self.assertEqual(user.provider_id, "12345")
        self.assertTrue(user.email_verified)
        self.assertEqual(user.avatar_url, "https://example.com/avatar.jpg")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_email_mismatch(self, mock_verify):
        """Test Google auth with email mismatch"""
        # Mock the Google token verification
        mock_verify.return_value = {
            "email": "different@example.com",  # Different from provided email
            "sub": "12345",
        }

        data = {
            "token": "fake-google-token",
            "email": "google@example.com",
            "name": "Google User",
        }

        response = self.client.post(self.google_auth_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_auth_invalid_token(self, mock_verify):
        """Test Google auth with invalid token"""
        # Mock raising ValueError for invalid token
        mock_verify.side_effect = ValueError("Invalid token")

        data = {
            "token": "invalid-token",
            "email": "google@example.com",
            "name": "Google User",
        }

        response = self.client.post(self.google_auth_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
