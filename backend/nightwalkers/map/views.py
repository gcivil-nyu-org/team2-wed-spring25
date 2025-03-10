import geopandas as gpd
from django.shortcuts import render
import os
from django.conf import settings
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import SavedRoute
from .serializers import RouteInputSerializer
import requests


def road_view(request):
    # Define the path to the GeoJSON file you want to query
    geojson_file_path = os.path.join(
        settings.BASE_DIR, "map", "data", "filtered_grouped_data_centroid.geojson"
    )

    # Load the GeoJSON file as a GeoDataFrame using GeoPandas
    points_gdf = gpd.read_file(geojson_file_path)

    rows = points_gdf.to_dict(orient="records")

    for row in rows:
        geometry = row["geometry"]
        row["longitude"] = geometry.x  # Longitude (geometry.x gives the longitude)
        row["latitude"] = geometry.y  # Latitude (geometry.y gives the latitude)

    # Pass the data to the template
    return render(request, "my_template.html", {"data": rows})

def heatmap_data(request):
    geojson_file_path = os.path.join(
        settings.BASE_DIR, "map", "data", "filtered_grouped_data_centroid.geojson"
    )

    # Load the GeoJSON file as a GeoDataFrame using GeoPandas
    points_gdf = gpd.read_file(geojson_file_path)

    # Extract latitude, longitude, and ratio
    heatmap_points = []
    for index, row in points_gdf.iterrows():
        latitude = row['geometry'].y
        longitude = row['geometry'].x
        ratio = row.get('ratio')  # Use .get() to handle potential missing 'ratio'

        # Ensure ratio is a number (handle potential None or non-numeric values)
        try:
            ratio = float(ratio) if ratio is not None else 0.0  # Default to 0 if None
        except (ValueError, TypeError):
            ratio = 0.0 #Default to zero if the ratio is not a valid number.

        heatmap_points.append({
            'latitude': latitude,
            'longitude': longitude,
            'intensity': ratio,
        })

    return JsonResponse(heatmap_points, safe=False)

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
