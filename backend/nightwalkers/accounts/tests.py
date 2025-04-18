from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from unittest.mock import patch, MagicMock
from .serializers import UserSerializer
from .models import ReportIssue
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

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
        # Updated to match the actual __str__ method that includes karma
        self.assertEqual(str(user), f"Test User (test@example.com) {user.get_karma()}")

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


class AuthViewsTests(APITestCase):
    """Tests for all authentication related views"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.profile_url = reverse("user-profile")
        self.refresh_url = reverse("token-refresh")
        self.verify_url = reverse("token-verify")

        # Create a test user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

        # Login and get tokens for token-related tests
        login_response = self.client.post(
            self.login_url,
            {"email": "test@example.com", "password": "testpass123"},
            format="json",
        )
        self.access_token = login_response.data["access"]
        self.refresh_token = login_response.data["refresh"]

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

        # Updated to match what RegisterView actually returns - just a success message
        self.assertIn("success", response.data)
        self.assertEqual(response.data["success"], "User registered successfully")

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

        # Check that 'user' key exists in the response
        self.assertIn("user", response.data)

        # Access the user data from the nested structure
        user_data = response.data["user"]

        # Check required fields
        self.assertEqual(user_data["email"], "test@example.com")
        self.assertEqual(user_data["first_name"], "Test")
        self.assertEqual(user_data["last_name"], "User")

    def test_profile_view_unauthenticated(self):
        """Test accessing profile without authentication"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_success(self):
        """Test successful logout"""
        data = {"refresh": self.refresh_token}
        response = self.client.post(self.logout_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_no_token(self):
        """Test logout without providing a refresh token"""
        response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "No refresh token provided")

    def test_logout_invalid_token(self):
        """Test logout with an invalid refresh token"""
        data = {"refresh": "invalid-token"}
        response = self.client.post(self.logout_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_token_refresh_success(self):
        """Test refreshing a token successfully"""
        data = {"refresh": self.refresh_token}
        response = self.client.post(self.refresh_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        # New access token should be different
        self.assertNotEqual(response.data["access"], self.access_token)

    def test_token_refresh_invalid(self):
        """Test refreshing with an invalid token"""
        data = {"refresh": "invalid-token"}
        response = self.client.post(self.refresh_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_verify_success(self):
        """Test verifying a valid token"""
        data = {"token": self.access_token}
        response = self.client.post(self.verify_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_verify_invalid(self):
        """Test verifying an invalid token"""
        data = {"token": "invalid-token"}
        response = self.client.post(self.verify_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_success(self):
        """Test retrieving an existing user"""
        user_url = reverse("get-user", kwargs={"user_id": self.user.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")
        self.assertEqual(response.data["first_name"], "Test")

    def test_get_nonexistent_user(self):
        """Test retrieving a non-existent user"""
        nonexistent_user_url = reverse("get-user", kwargs={"user_id": 9999})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(nonexistent_user_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "User not found")

    def test_get_user_unauthenticated(self):
        """Test retrieving a user without authentication"""
        user_url = reverse("get-user", kwargs={"user_id": self.user.id})
        response = self.client.get(user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDataManagementTests(APITestCase):
    """Tests for user data management: reports, name changes, password changes"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse("login")
        self.report_url = reverse("report-app-issue")
        self.change_password_url = reverse("change-password")
        self.change_names_url = reverse("change-names")

        # Create regular user
        self.regular_user = User.objects.create_user(
            email="regular@example.com",
            password="testpass123",
            first_name="Regular",
            last_name="User",
        )

        # Create Google user
        self.google_user = User.objects.create_user(
            email="google@example.com",
            password="testpass123",
            first_name="Google",
            last_name="User",
            provider="google",
            provider_id="12345",
        )

        # Login and get tokens
        self.regular_login_response = self.client.post(
            self.login_url,
            {"email": "regular@example.com", "password": "testpass123"},
            format="json",
        )
        self.regular_access_token = self.regular_login_response.data["access"]

        self.google_login_response = self.client.post(
            self.login_url,
            {"email": "google@example.com", "password": "testpass123"},
            format="json",
        )
        self.google_access_token = self.google_login_response.data["access"]

        # Create test reports
        self.report1 = ReportIssue.objects.create(
            user=self.regular_user,
            title="Test Issue 1",
            description="This is a test issue description",
        )

        # Create a report for Google user too
        self.report3 = ReportIssue.objects.create(
            user=self.google_user,
            title="Google User's Issue",
            description="This belongs to google user",
        )

        # Setup test data
        self.valid_report_data = {
            "title": "New Test Issue",
            "description": "This is a new test issue",
        }

        self.invalid_report_data = {
            # Missing title
            "description": "This is an invalid test issue"
        }

    def test_get_reports_authenticated(self):
        """Test retrieving reports when authenticated"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )
        response = self.client.get(self.report_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # One report for this user

    def test_get_reports_unauthenticated(self):
        """Test retrieving reports when not authenticated"""
        # No authentication
        response = self.client.get(self.report_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_report_success(self):
        """Test creating a report successfully"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )
        response = self.client.post(
            self.report_url, self.valid_report_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["success"], "Report submitted successfully")
        self.assertTrue(ReportIssue.objects.filter(title="New Test Issue").exists())

    def test_create_report_invalid_data(self):
        """Test creating a report with invalid data"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )
        response = self.client.post(
            self.report_url, self.invalid_report_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)  # Should have error for missing title

    def test_change_password_success(self):
        """Test successful password change for regular user"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        data = {"current_password": "testpass123", "new_password": "NewPassword123!"}

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success"], "Password changed successfully")

        # Verify password was actually changed
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.check_password("NewPassword123!"))

    def test_change_password_google_user(self):
        """Test password change denied for Google user"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.google_access_token}")

        data = {"current_password": "testpass123", "new_password": "NewPassword123!"}

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"],
            "Account is managed by google",
        )

    def test_change_password_incorrect_current(self):
        """Test password change with incorrect current password"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        data = {
            "current_password": "wrongpassword",  # Incorrect password
            "new_password": "NewPassword123!",
        }

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Current password is incorrect")

    def test_change_password_missing_fields(self):
        """Test password change with missing fields"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        # Missing new_password
        data = {"current_password": "testpass123"}

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_change_password_weak_password(self):
        """Test password change with weak password that fails validation"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        data = {
            "current_password": "testpass123",
            "new_password": "123",  # Too short, will fail Django's validation
        }

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_change_password_unauthenticated(self):
        """Test password change without authentication"""
        # No auth token
        data = {"current_password": "testpass123", "new_password": "NewPassword123!"}

        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_names_success(self):
        """Test successful name change for regular user"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        data = {"first_name": "Updated", "last_name": "Name"}

        response = self.client.post(self.change_names_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success"], "Names updated successfully")

        # Verify names were actually changed
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.first_name, "Updated")
        self.assertEqual(self.regular_user.last_name, "Name")

        # Check user data is returned in response
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["first_name"], "Updated")
        self.assertEqual(response.data["user"]["last_name"], "Name")

    def test_change_names_google_user(self):
        """Test name change denied for Google user"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.google_access_token}")

        data = {"first_name": "Updated", "last_name": "Name"}

        response = self.client.post(self.change_names_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"],
            "Account is managed by google",
        )

    def test_change_names_missing_fields(self):
        """Test name change with missing fields"""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.regular_access_token}"
        )

        # Missing last_name
        data = {"first_name": "Updated"}

        response = self.client.post(self.change_names_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(
            response.data["error"], "First name and last name are required"
        )

    def test_change_names_unauthenticated(self):
        """Test name change without authentication"""
        # No auth token
        data = {"first_name": "Updated", "last_name": "Name"}

        response = self.client.post(self.change_names_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserSerializerTests(TestCase):
    """Tests for the UserSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
            avatar_url="https://example.com/avatar.jpg",
        )

    def test_user_serializer_fields(self):
        """Test that all expected fields are in the serializer"""
        serializer = UserSerializer(instance=self.user)
        data = serializer.data

        expected_fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "email_verified",
            "provider",
            "avatar",
            "date_joined",
            "avatar_url",
            "total_saved_routes",
        ]

        for field in expected_fields:
            self.assertIn(field, data)

    def test_get_avatar_method(self):
        """Test the get_avatar method"""
        serializer = UserSerializer(instance=self.user)
        # Should match the avatar_url as we didn't set an uploaded avatar
        self.assertEqual(serializer.data["avatar"], "https://example.com/avatar.jpg")

    def test_get_total_saved_routes(self):
        """Test the get_total_saved_routes method"""
        serializer = UserSerializer(instance=self.user)
        # Initially should be 0 as we haven't added any saved routes
        self.assertEqual(serializer.data["total_saved_routes"], 0)


class UploadProfilePicViewTest(APITestCase):
    def setUp(self):
        self.upload_photo_url = reverse("upload_profile_pic")
        self.user = User.objects.create_user(
            email="test@example.com",
            first_name="Test",
            last_name="User",
            password="testpassword",
        )

    def generate_test_image(
        self, size=(100, 100), name="test.jpg", format="JPEG", color="red"
    ):
        image = Image.new("RGB", size, color=color)
        temp_file = BytesIO()
        image.save(temp_file, format=format)
        temp_file.seek(0)
        return SimpleUploadedFile(name, temp_file.read(), content_type="image/jpeg")

    def test_upload_new_photo_authenticated(self):
        """Test uploading a valid photo with authentication."""
        self.client.force_authenticate(user=self.user)
        image = self.generate_test_image()
        response = self.client.post(
            self.upload_photo_url, {"avatar": image}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("success", response.json())
        self.assertIn("user", response.json())
        self.assertIsNotNone(User.objects.get(pk=self.user.id).avatar.name)

    def test_upload_new_photo_unauthenticated(self):
        """Test uploading a photo without authentication."""
        image = self.generate_test_image()
        response = self.client.post(
            self.upload_photo_url, {"avatar": image}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_new_photo_no_file(self):
        """Test uploading without providing a photo file."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.upload_photo_url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "Please select an image file.")

    def test_upload_new_photo_invalid_file_type(self):
        """Test uploading a file with an invalid content type."""
        self.client.force_authenticate(user=self.user)
        # Generate a text file instead of an image
        text_file = BytesIO(b"This is a text file.")
        response = self.client.post(
            self.upload_photo_url, {"avatar": text_file}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(
            response.json()["error"],
            "Invalid file type. Only JPEG and PNG are allowed.",
        )

    def test_upload_new_photo_large_file(self):
        """Test uploading a file exceeding the maximum allowed size."""
        self.client.force_authenticate(user=self.user)
        large_image = self.generate_test_image(
            size=(30000, 30000), format="PNG", name="large_test.png"
        )
        response = self.client.post(
            self.upload_photo_url, {"avatar": large_image}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(
            response.json()["error"], "Image file is too large. Maximum size is 2MB."
        )

    def test_upload_new_photo_google_user(self):
        """Test uploading a photo for a Google user."""
        google_user = User.objects.create_user(
            email="google_user@example.com",
            first_name="Google",
            last_name="User",
            password="testpassword",
            provider="google",
        )
        self.client.force_authenticate(user=google_user)
        image = self.generate_test_image()
        response = self.client.post(
            self.upload_photo_url, {"avatar": image}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "Account is managed by Google")

    def test_upload_clears_avatar_url(self):
        """Test that uploading a photo clears the avatar_url."""
        self.client.force_authenticate(user=self.user)
        self.user.avatar_url = "https://example.com/old_avatar.jpg"
        self.user.save()

        image = self.generate_test_image()

        response = self.client.post(
            self.upload_photo_url, {"avatar": image}, format="multipart"
        )
        print(response.status_code)
        print(response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Assert success
        self.user.refresh_from_db()
        self.assertIsNone(self.user.avatar_url)
        self.assertIsNotNone(self.user.avatar.name)
