from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from unittest.mock import patch, MagicMock
from .serializers import UserReportSerializer, UserSerializer
from .models import ReportIssue

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

    def test_logout_view_success(self):
        """Test successful logout"""
        # First login to get a token
        login_data = {"email": "test@example.com", "password": "testpass123"}
        login_response = self.client.post(self.login_url, login_data, format="json")
        refresh_token = login_response.data["refresh"]
        data = {"refresh": refresh_token}
        response = self.client.post(self.logout_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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


class ReportIssueViewTests(APITestCase):
    """Tests for ReportIssue views"""

    def setUp(self):
        self.client = APIClient()
        self.report_url = reverse("report-app-issue")

        # Create test users
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

        self.user2 = User.objects.create_user(
            email="test2@example.com",
            password="testpass123",
            first_name="Test2",
            last_name="User",
        )

        # Create some test reports
        self.report1 = ReportIssue.objects.create(
            user=self.user,
            title="Test Issue 1",
            description="This is a test issue description",
        )

        self.report2 = ReportIssue.objects.create(
            user=self.user,
            title="Test Issue 2",
            description="Another test issue description",
        )

        self.report3 = ReportIssue.objects.create(
            user=self.user2,
            title="Another User's Issue",
            description="This belongs to user2",
        )

        # Valid report data for testing POST
        self.valid_report_data = {
            "title": "New Test Issue",
            "description": "This is a new test issue",
        }

        self.invalid_report_data = {
            # Missing title
            "description": "This is an invalid test issue"
        }

        # Data with all fields for comprehensive serializer testing
        self.comprehensive_data = {
            "title": "Comprehensive Test Issue",
            "description": "This is a detailed description for testing all fields",
        }

    def test_get_reports_authenticated(self):
        """Test retrieving reports when authenticated"""
        # Login the user
        self.client.force_authenticate(user=self.user)

        # Get reports
        response = self.client.get(self.report_url)

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should only return reports for the authenticated user (2 reports)
        self.assertEqual(len(response.data), 2)

        # Verify report details
        self.assertEqual(response.data[0]["title"], "Test Issue 1")
        self.assertEqual(
            response.data[0]["description"], "This is a test issue description"
        )
        self.assertEqual(response.data[1]["title"], "Test Issue 2")

        # Check required fields from the serializer are present
        required_fields = ["id", "title", "description", "reported_at", "user"]
        for field in required_fields:
            self.assertIn(field, response.data[0])

    def test_get_reports_unauthenticated(self):
        """Test retrieving reports when not authenticated"""
        # No authentication
        response = self.client.get(self.report_url)

        # Should return 401
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_report_success(self):
        """Test creating a report successfully"""
        # Login the user
        self.client.force_authenticate(user=self.user)

        # Create a new report
        response = self.client.post(
            self.report_url, self.valid_report_data, format="json"
        )

        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["success"], "Report submitted successfully")

        # Verify the report was created in the database
        self.assertTrue(ReportIssue.objects.filter(title="New Test Issue").exists())

        # Verify the report is associated with the current user
        report = ReportIssue.objects.get(title="New Test Issue")
        self.assertEqual(report.user, self.user)

    def test_create_report_invalid_data(self):
        """Test creating a report with invalid data"""
        # Login the user
        self.client.force_authenticate(user=self.user)

        # Try to create a report with invalid data
        response = self.client.post(
            self.report_url, self.invalid_report_data, format="json"
        )

        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Check that validation errors are in the response
        self.assertIn("title", response.data)  # Should have error for missing title

    def test_serializer_validation(self):
        """Test the UserReportSerializer validation in detail"""
        # Create empty serializer to test validation
        serializer = UserReportSerializer(data={})
        self.assertFalse(serializer.is_valid())

        # Check required fields
        self.assertIn("title", serializer.errors)
        self.assertIn("description", serializer.errors)

        # Test with valid data
        serializer = UserReportSerializer(data=self.valid_report_data)
        self.assertTrue(serializer.is_valid())

        # Test with comprehensive data
        serializer = UserReportSerializer(data=self.comprehensive_data)
        self.assertTrue(serializer.is_valid())


class GetUserViewTests(APITestCase):
    """Tests for GetUser view"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse("login")

        # Create test users
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

        # URL pattern requires user_id
        self.user_url = reverse("get-user", kwargs={"user_id": self.user.id})
        self.nonexistent_user_url = reverse(
            "get-user", kwargs={"user_id": 9999}
        )  # Non-existent ID

        # Login to get authentication token
        login_response = self.client.post(
            self.login_url,
            {"email": "test@example.com", "password": "testpass123"},
            format="json",
        )
        self.access_token = login_response.data["access"]

    def test_get_user_success(self):
        """Test retrieving an existing user"""
        # Set authentication credentials
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(self.user_url)

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user details
        self.assertEqual(response.data["email"], "test@example.com")
        self.assertEqual(response.data["first_name"], "Test")
        self.assertEqual(response.data["last_name"], "User")

    def test_get_nonexistent_user(self):
        """Test retrieving a non-existent user"""
        # Set authentication credentials
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(self.nonexistent_user_url)

        # Should return 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "User not found")

    def test_get_user_unauthenticated(self):
        """Test retrieving a user without authentication"""
        # Don't set any authentication credentials
        response = self.client.get(self.user_url)

        # Should return 401 Unauthorized
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

        # We would add test for adding saved routes here if we had the model,
        # but we'll skip that as we don't have the SavedRoute model info


class TokenRefreshAndVerifyTests(APITestCase):
    """Tests for JWT token refresh and verify endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse("login")
        self.refresh_url = reverse("token-refresh")
        self.verify_url = reverse("token-verify")

        # Create a test user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

        # Login to get tokens
        response = self.client.post(
            self.login_url,
            {"email": "test@example.com", "password": "testpass123"},
            format="json",
        )
        self.access_token = response.data["access"]
        self.refresh_token = response.data["refresh"]

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


class LogoutViewTests(APITestCase):
    """Additional tests for LogoutView"""

    def setUp(self):
        self.client = APIClient()
        self.logout_url = reverse("logout")
        self.login_url = reverse("login")

        # Create a test user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

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
        # The exact error message will depend on the JWT library's implementation
        self.assertIn("error", response.data)
