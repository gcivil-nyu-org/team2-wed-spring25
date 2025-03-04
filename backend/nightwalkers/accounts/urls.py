from django.urls import path
from .views import GoogleAuthView, UserProfileView, \
                   LogoutView, LoginView, RegisterView
from rest_framework_simplejwt.views import \
        TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),
         name='token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
]
