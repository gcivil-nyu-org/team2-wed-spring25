from django.urls import path
from .views import (
    GoogleAuthView,
    UserProfileView,
    LogoutView,
    LoginView,
    RegisterView,
    GetUserView,
    ReportIssueView,
    ChangePasswordView,
    ChangeUserNamesView,
    ChangeFCMTokenView,
    UploadProfilePic,
    BanUserView,
)
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path("auth/google/", GoogleAuthView.as_view(), name="google-auth"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("users/me/", UserProfileView.as_view(), name="user-profile"),
    path("users/<int:user_id>/", GetUserView.as_view(), name="get-user"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("report-app-issue/", ReportIssueView.as_view(), name="report-app-issue"),
    path("user/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("user/change-names/", ChangeUserNamesView.as_view(), name="change-names"),
    path("user/update-fcm-token/", ChangeFCMTokenView.as_view(), name="change-fcm-token"),
    path(
        "user/change-profile-picture/",
        UploadProfilePic.as_view(),
        name="upload_profile_pic",
    ),  # For image uploads
    path("users/<int:user_id>/ban/", BanUserView.as_view(), name="ban-user"),
]
