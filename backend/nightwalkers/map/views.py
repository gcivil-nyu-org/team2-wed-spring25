# import geopandas as gpd
from django.shortcuts import render
import os

# from django.conf import settings
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import SavedRoute
from .serializers import (
    RouteInputSerializer,
    SavedRouteSerializer,
    SavedRouteUpdateSerializer,
)
import requests
from django.db import connection  # Import the connection object


def road_view(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT ST_Y(wkb_geometry) AS latitude,
                ST_X(wkb_geometry) AS longitude,
                * FROM filtered_grouped_data_centroid;"""
            )

            rows = []
            columns = [desc[0] for desc in cursor.description]
            for row in cursor.fetchall():
                row_dict = dict(zip(columns, row))
                rows.append(row_dict)

        return render(request, "my_template.html", {"data": rows})

    except Exception as error:
        print("Error while fetching data from PostgreSQL", error)
        return render(request, "my_template.html", {"data": []})


def heatmap_data(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT ST_Y(wkb_geometry) AS latitude,
                ST_X(wkb_geometry) AS longitude,
                CMPLNT_NUM
                FROM filtered_grouped_data_centroid;"""
            )

            heatmap_points = []
            for row in cursor.fetchall():
                latitude, longitude, complaints = row
                try:
                    complaints = float(complaints) if complaints is not None else 0.0
                except (ValueError, TypeError):
                    complaints = 0.0

                heatmap_points.append(
                    {
                        "latitude": latitude,
                        "longitude": longitude,
                        "intensity": complaints,
                    }
                )

        return JsonResponse(heatmap_points, safe=False)

    except Exception as error:
        print("Error while fetching data from PostgreSQL", error)
        return JsonResponse([], safe=False)


class RouteViewAPI(generics.GenericAPIView):
    serializer_class = RouteInputSerializer
    permission_classes = [IsAuthenticated]  # Change to IsAuthenticated on develop

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        route_id = validated_data.get("route_id")
        save_route = validated_data.get("saved_route", False)
        if save_route:
            if not request.user.is_authenticated:
                return Response(
                    {"error": "No valid credentials found"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        # if we want to save routes then this will check
        # in the database first if not then use the coordinates
        if route_id:
            try:
                saved_route = SavedRoute.objects.get(id=route_id)
                departure_lat = saved_route.departure_lat
                departure_lon = saved_route.departure_lon
                destination_lat = saved_route.destination_lat
                destination_lon = saved_route.destination_lon
                departure = [departure_lon, departure_lat]
                destination = [destination_lon, destination_lat]
            except SavedRoute.DoesNotExist:
                return Response(
                    {"error": "The route provided does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            departure_lat, departure_lon = validated_data.get("departure")
            destination_lat, destination_lon = validated_data.get("destination")
            departure = [departure_lon, departure_lat]
            destination = [destination_lon, destination_lat]

        initial_route = self.get_initial_route(departure, destination)

        if "error" in initial_route:
            return Response(initial_route, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            # TODO: Call the function that will process the data
            # safer_route = process_route_with_crime_data(initial_route)
            saved_id = None
            if save_route and not route_id:
                saved_route = SavedRoute.objects.create(
                    user=request.user,
                    name=validated_data.get("name", "UnnamedRoute"),
                    departure_lat=departure_lat,
                    departure_lon=departure_lon,
                    destination_lat=destination_lat,
                    destination_lon=destination_lon,
                )
                saved_id = saved_route.id
            return Response(
                {
                    "initial_route": initial_route,
                    "safer_route": None,
                    "route_id": saved_id,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            # if there is an error on getting the safer route fallback
            saved_id = None
            if save_route and request.user.is_authenticated and not route_id:
                saved_route = SavedRoute.objects.create(
                    user=request.user,
                    name=validated_data.get("name", "Unnamed Route"),
                    departure_lat=departure_lat,
                    departure_lon=departure_lon,
                    destination_lat=destination_lat,
                    destination_lon=destination_lon,
                )
                saved_id = saved_route.id
            return Response(
                {
                    "initial_route": initial_route,
                    "safer_route": None,  # This will be none
                    "message": f"Could not fetch a safer route: {str(e)}",
                    "route_id": saved_id,
                },
                status=status.HTTP_200_OK,
            )

    def get_initial_route(self, departure, destination):
        """
        Get the route from OpenRouteService or other service
        """
        map_api_key = os.getenv("ORS_API_KEY")
        map_url = "https://api.openrouteservice.org/v2/directions/foot-walking"
        headers = {
            "Authorization": f"{map_api_key}",
            "Content-Type": "application/json; charset=utf-8",
        }
        body = {
            "coordinates": [departure, destination],
            "format": "geojson",
        }
        try:
            response = requests.post(map_url, json=body, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"Error processing route request: {str(e)}"}
        except Exception as e:
            return {"error": f"Error processing route request: {str(e)}"}


class SaveRouteAPIView(generics.GenericAPIView):
    serializer_class = SavedRouteSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print(request.data)
        serializer = self.get_serializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RetrieveSavedRoutesListAPIView(generics.ListAPIView):
    serializer_class = SavedRouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRoute.objects.filter(user=self.request.user).order_by(
            "-favorite", "-created_at"
        )

    # No get function needed, leveraging all the return to DRF functions


class UpdateSavedRouteAPIView(generics.UpdateAPIView):
    serializer_class = SavedRouteUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRoute.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = queryset.get(id=self.request.data["id"])
        self.check_object_permissions(self.request, obj)
        return obj


class DeleteSavedRouteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRoute.objects.filter(user=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = queryset.get(id=self.request.data["id"])
        self.check_object_permissions(self.request, obj)
        return obj
