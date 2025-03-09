from django.urls import path
from .views import RouteViewAPI

urlpatterns = [
    path('get-route/', RouteViewAPI.as_view(), name='get_route'),
]