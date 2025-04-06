from django.urls import path
from . import views

urlpatterns = [
    path('<int:user_id>/', views.get_mutual_follows_with_chats, name='get_mutual_follows_with_chats'),
    # path('chat/<str:room_name>/', views.room, name='room'),
]