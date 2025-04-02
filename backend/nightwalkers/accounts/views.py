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

# from .models import User
from .serializers import UserSerializer
from django.contrib.auth import authenticate


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
    # If you want tests to expect 401 when unauthenticated, use IsAuthenticated
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "No refresh token provided"}, status=400)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": "Logged out successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)
