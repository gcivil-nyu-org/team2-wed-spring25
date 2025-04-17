from django.urls import path
from .views import (
    RouteViewAPI,
    SaveRouteAPIView,
    UpdateSavedRouteAPIView,
    DeleteSavedRouteAPIView,
    RetrieveSavedRoutesListAPIView,
    HeatmapDataView
)

urlpatterns = [
    path("map/heatmap-data/", HeatmapDataView.as_view(), name="heatmap-data"),
    path("get-route/", RouteViewAPI.as_view(), name="get-route"),
    path("save-route/", SaveRouteAPIView.as_view(), name="save-route"),
    path(
        "delete-route/<int:pk>/", DeleteSavedRouteAPIView.as_view(), name="delete-route"
    ),
    path(
        "retrieve-routes/",
        RetrieveSavedRoutesListAPIView.as_view(),
        name="retrieve-routes",
    ),
    path("update-route/", UpdateSavedRouteAPIView.as_view(), name="update-route"),
]
