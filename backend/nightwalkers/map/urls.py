from django.urls import path
from .views import (
    RouteViewAPI,
    heatmap_data,
    SaveRouteAPIView,
    UpdateSavedRouteAPIView,
    DeleteSavedRouteAPIView,
    RetrieveSavedRoutesListAPIView,
)

urlpatterns = [
    path("map/heatmap-data/", heatmap_data, name="heatmap-data"),
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
