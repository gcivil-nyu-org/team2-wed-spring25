from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError
from .models import ReportIssue
from .serializers import UserSerializer, UserReportSerializer
from django.contrib.auth import authenticate
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


User = get_user_model()  # noqa: F811


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def get_standard_response(user):
    """Standardized response format for all auth endpoints"""
    tokens = get_tokens_for_user(user)
    return {
        "access": tokens["access"],
        "refresh": tokens["refresh"],
        "user": UserSerializer(user).data,
    }


class GoogleAuthView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        token = request.data.get("token")
        email = request.data.get("email")
        name = request.data.get("name", "").strip()

        first_name, last_name = "", ""

        if name:
            name_parts = name.split()
            first_name = name_parts[0] if name_parts else ""
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        try:
            # Verify the Google token
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )

            if idinfo["email"] != email:
                return Response(
                    {"error": "Email verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            print("google login")
            # Use Google's given_name and family_name if available
            first_name = idinfo.get("given_name", first_name)
            last_name = idinfo.get("family_name", last_name)

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "provider": "google",
                    "provider_id": idinfo["sub"],
                    "email_verified": True,
                    "avatar_url": idinfo.get("picture", ""),
                },
            )

            if not created:
                # Update existing user's Google info
                user.provider = "google"
                user.provider_id = idinfo["sub"]
                user.email_verified = True
                user.first_name = first_name
                user.last_name = last_name

                if "picture" in idinfo:
                    user.avatar_url = idinfo["picture"]

                user.save()

            # Use standardized response format
            return Response(get_standard_response(user), status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate with email as the USERNAME_FIELD
        user = authenticate(email=email, password=password)

        if user is not None:
            # Use standardized response format
            return Response(get_standard_response(user))
        else:
            return Response(
                {"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # Required fields for your user model
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        password = data.get("password")

        # Validate required fields
        if not email or not password or not first_name or not last_name:
            return Response(
                {
                    "detail": "First name, last name, \
                email, and password are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        # Create the user
        try:
            User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            return Response(
                {
                    "success": "User registered successfully",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        print(f"User id: {request.user.id}")
        user = User.objects.get(id=request.user.id)
        user_serializer = UserSerializer(user)
        return Response(
            {"user": user_serializer.data},
        )


class GetUserView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class LogoutView(APIView):
    # Users do not have to pass an access token
    permission_classes = (AllowAny,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "No refresh token provided"}, status=400)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": "Logged out successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReportIssueView(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserReportSerializer

    def get_queryset(self):
        return ReportIssue.objects.filter(user=self.request.user)

    def get(self, request, *args, **kwargs):
        reports = self.get_queryset()
        report_serializer = self.serializer_class(reports, many=True)
        return Response(report_serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = UserReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            serializer.save(user=request.user)
            return Response(
                {"success": "Report submitted successfully"},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": f"There was an error saving the data: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if user is a Google user
        if user.provider == "google":
            return Response(
                {"error": "Account is managed by google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        # Validate input
        if not current_password or not new_password:
            return Response(
                {"error": "Current password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate new password
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        # Use standardized response format
        return Response(
            {"success": "Password changed successfully"},
            status=status.HTTP_200_OK,
        )


class ChangeUserNamesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if user is a Google user
        if user.provider == "google":
            return Response(
                {"error": "Account is managed by google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")

        # Validate input
        if not first_name or not last_name:
            return Response(
                {"error": "First name and last name are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update names
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        return Response(
            {
                "success": "Names updated successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ChangeFCMTokenView(APIView):
    authentication_classes = []  # Disable all authentication
    permission_classes = []  # Disable all permission checks

    def post(self, request):
        try:
            user_id = request.data.get("user_id")
            fcm_token = request.data.get("fcm_token")
            user = User.objects.get(id=user_id)
            if not fcm_token:
                return Response(
                    {"error": "FCM token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update FCM token
            user.fcm_token = fcm_token
            user.save()

            return Response(
                {"success": "FCM token updated successfully"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Error in ChangeFCMTokenView: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UploadProfilePic(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Support file and JSON

    def post(self, request, *args, **kwargs):
        user = request.user

        if user.provider == "google":
            return Response(
                {"error": "Account is managed by Google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_file = request.FILES.get("avatar")  # File upload
        avatar_url = request.data.get("avatar_url")  # Cloudinary URL or external image

        # Handle direct file upload
        if image_file:
            allowed_types = ["image/jpeg", "image/png"]
            if image_file.content_type not in allowed_types:
                return Response(
                    {"error": "Invalid file type. Only JPEG and PNG are allowed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            max_size = 2 * 1024 * 1024  # 2MB
            if image_file.size > max_size:
                return Response(
                    {"error": "Image file is too large. Maximum size is 2MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.avatar = image_file  # save image to local file/image field
            user.avatar_url = None  # clear cloud URL if switching to local
            user.save()

        # Handle external URL upload (e.g. Cloudinary)
        elif avatar_url:
            user.avatar_url = avatar_url
            user.avatar = None  # clear local image if switching to cloud
            user.save()

        else:
            return Response(
                {"error": "Please select an image file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": "Profile picture updated successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
