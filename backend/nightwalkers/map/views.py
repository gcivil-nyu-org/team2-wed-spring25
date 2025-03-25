# import geopandas as gpd
import math

from django.shortcuts import render
import os
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
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
import polyline
from shapely import geometry
from shapely.geometry import Polygon, MultiPolygon


def top_10_points(request):
    try:
        # TO DO: Replace with the linestring that's passed from the routing API
        line_string = "LINESTRING(40.83966017062337 -73.90546599999998, \
            40.73443349380265 -73.980293499999992)"
        # SQL query to calculate the distance between points and the LineString
        query = """
            SELECT ST_Y(wkb_geometry) AS latitude,
                   ST_X(wkb_geometry) AS longitude,
                   CMPLNT_NUM,
                   ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) AS distance
            FROM filtered_grouped_data_centroid
            WHERE CMPLNT_NUM > 10
            ORDER BY distance
            LIMIT 10;
        """

        # Execute the query
        with connection.cursor() as cursor:
            cursor.execute(query, [line_string])

            heatmap_points = []
            for row in cursor.fetchall():
                latitude, longitude, complaints, distance = row
                try:
                    complaints = float(complaints) if complaints is not None else 0.0
                except (ValueError, TypeError):
                    complaints = 0.0

                heatmap_points.append(
                    {
                        "latitude": latitude,
                        "longitude": longitude,
                        "intensity": complaints,
                        "distance": distance,
                    }
                )

        return JsonResponse(heatmap_points, safe=False)

    except Exception as error:
        print("Error while fetching data from PostgreSQL", error)
        return JsonResponse([], safe=False)


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
            safer_route = process_route_with_crime_data(initial_route)
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
                    "safer_route": safer_route,
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


class RoutesPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class RetrieveSavedRoutesListAPIView(generics.ListAPIView):
    serializer_class = SavedRouteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = RoutesPagination

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
        print(self.request.data)
        obj = queryset.get(id=self.request.data["id"])
        self.check_object_permissions(self.request, obj)
        return obj


class DeleteSavedRouteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedRoute.objects.filter(user=self.request.user)


def process_route_with_crime_data(initial_route):
    """
    Process the initial route and create a safer route that avoids high-crime areas
    using OpenRouteService's avoid_polygons feature.

    Args:
        initial_route (dict): The initial route from ORS
    Returns:
        dict: The safer route from ORS that avoids crime hotspots
    """
    # Extract departure and destination coordinates from the initial route
    encoded_polyline = initial_route["routes"][0]["geometry"]
    decoded_coords = polyline.decode(encoded_polyline, geojson=True)

    # Start and end points
    departure = decoded_coords[0]
    destination = decoded_coords[-1]

    # Create a LineString for querying crime hotspots
    linestring_coords = ", ".join(
        [f"{coord[0]} {coord[1]}" for coord in decoded_coords]
    )
    linestring = f"LINESTRING({linestring_coords})"

    # Get crime hotspots and create avoidance polygons
    crime_hotspots = get_crime_hotspots(linestring)
    avoid_polygons = create_avoid_polygons(crime_hotspots)

    # Get a new route that avoids the high-crime areas
    safer_route = get_safer_ors_route(departure, destination, avoid_polygons)

    return safer_route


def get_crime_hotspots(linestring):
    """
    Query the database to find the top 10 crime hotspots near the route
    """
    query = """
        SELECT
            ST_Y(wkb_geometry) AS latitude,
            ST_X(wkb_geometry) AS longitude,
            CMPLNT_NUM,
            ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) AS distance
        FROM filtered_grouped_data_centroid
        WHERE CMPLNT_NUM > 10
        ORDER BY distance
        LIMIT 10;
    """

    hotspots = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [linestring])
            for row in cursor.fetchall():
                latitude, longitude, complaints, distance = row

                complaints = float(complaints) if complaints is not None else 0.0

                hotspots.append(
                    {
                        "latitude": latitude,
                        "longitude": longitude,
                        "complaints": complaints,
                        "distance": distance,
                    }
                )
    except Exception as e:
        print(f"Error querying the database: {str(e)}")

    return hotspots


def create_avoid_polygons(hotspots, radius=0.1):
    """
    Create Shapely Polygons around crime hotspots for ORS avoid_polygons feature

    Args:
        hotspots (list): Crime hotspot points
        radius (float): Radius in kilometers for avoidance area

    Returns:
        MultiPolygon: Shapely MultiPolygon of areas to avoid
    """
    polygon_list = []

    for hotspot in hotspots:
        # Scale radius based on complaints (crime intensity)
        scaled_radius = radius * (1 + (hotspot["complaints"] / 100))

        # Create a simple circle-like polygon with 8 points
        polygon_points = []
        for i in range(8):
            angle = math.radians(i * 45)
            lat_offset = scaled_radius / 111.32  # 1 degree lat ≈ 111.32 km
            lon_offset = scaled_radius / (
                111.32 * math.cos(math.radians(hotspot["latitude"]))
            )

            lat = hotspot["latitude"] + lat_offset * math.sin(angle)
            lon = hotspot["longitude"] + lon_offset * math.cos(angle)
            polygon_points.append((lon, lat))

        # Close the polygon
        polygon_points.append(polygon_points[0])

        # Create Shapely Polygon and add to list
        polygon = Polygon(polygon_points)
        polygon_list.append(polygon)

    # Create MultiPolygon from all polygons
    if polygon_list:
        return MultiPolygon(polygon_list)
    else:
        # Return None if no hotspots were found
        return None


def get_safer_ors_route(departure, destination, avoid_polygons):
    """
    Get a route from OpenRouteService that avoids specified areas

    Args:
        departure (list): Starting point coordinates [longitude, latitude]
        destination (list): Ending point coordinates [longitude, latitude]
        avoid_polygons (MultiPolygon): Shapely MultiPolygon of areas to avoid

    Returns:
        dict: The OpenRouteService Directions API response
    """
    map_api_key = os.getenv("ORS_API_KEY")
    map_url = "https://api.openrouteservice.org/v2/directions/foot-walking"

    headers = {
        "Authorization": f"{map_api_key}",
        "Content-Type": "application/json; charset=utf-8",
    }

    # Base request parameters
    body = {
        "coordinates": [departure, destination],
        "format": "geojson",
    }

    # Add avoid_polygons if we have hotspots to avoid
    if avoid_polygons:
        # Convert MultiPolygon to GeoJSON using shapely's mapping function
        body["options"] = {"avoid_polygons": geometry.mapping(avoid_polygons)}

    try:
        response = requests.post(map_url, json=body, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting safer ORS route: {str(e)}")
        return {"error": f"Error processing route request: {str(e)}"}
