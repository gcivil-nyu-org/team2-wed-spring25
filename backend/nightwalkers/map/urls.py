from django.urls import path
from .views import RouteViewAPI, heatmap_data, road_view

urlpatterns = [
    path("map/road-data/", road_view, name="road-data"),
    path("map/heatmap-data/", heatmap_data, name="heatmap-data"),
    path("get-route/", RouteViewAPI.as_view(), name="get-route"),
]
