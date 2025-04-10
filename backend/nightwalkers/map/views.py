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
from django.db import connection
import polyline
from shapely import geometry
from shapely.geometry import Point, MultiPolygon
from shapely.ops import transform
import pyproj


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
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        # This will now validate both the existing rules and NYC bounds
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid route parameters", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data = serializer.validated_data

        departure_lat, departure_lon = validated_data.get("departure")
        destination_lat, destination_lon = validated_data.get("destination")
        departure = [departure_lon, departure_lat]
        destination = [destination_lon, destination_lat]

        initial_route = self.get_initial_route(departure, destination)
        if "error" in initial_route:
            return Response(initial_route, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            safer_route = process_route_with_crime_data(initial_route)

            return Response(
                {
                    "initial_route": initial_route,
                    "safer_route": safer_route,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "initial_route": initial_route,
                    "safer_route": None,
                    "message": f"Could not fetch a safer route: {str(e)}",
                },
                status=status.HTTP_200_OK,
            )

    def get_initial_route(self, departure, destination):
        """
        Get the route from OpenRouteService
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
    Two-phase process to create a safer route:
    1. First identify crime hotspots along the initial route
    2. Create a safer route avoiding those hotspots
    3. Find additional hotspots along this safer route
    4. Create a final safer route avoiding all identified hotspots

    Args:
        initial_route (dict): The initial route from ORS
    Returns:
        dict: The final safer route that avoids crime hotspots
    """
    print("=== Phase 1: Processing initial route ===")
    # Extract departure and destination coordinates
    encoded_polyline = initial_route["routes"][0]["geometry"]
    decoded_coords = polyline.decode(encoded_polyline, geojson=True)

    departure = decoded_coords[0]
    destination = decoded_coords[-1]

    # Create LineString for initial route
    linestring_coords = ", ".join(
        [f"{coord[0]} {coord[1]}" for coord in decoded_coords]
    )
    initial_linestring = f"LINESTRING({linestring_coords})"

    # Phase 1: Get the first set of crime hotspots along the initial route
    phase1_hotspots = get_crime_hotspots(initial_linestring, limit=7)
    print(f"Found {len(phase1_hotspots)} hotspots along initial route")

    # Create avoidance polygons for phase 1 hotspots
    phase1_polygons = create_avoid_polygons(phase1_hotspots)

    # Get intermediate safer route avoiding phase 1 hotspots
    intermediate_route = get_safer_ors_route(departure, destination, phase1_polygons)

    # Check if we got a valid intermediate route
    if "error" in intermediate_route:
        print(f"Error in intermediate route: {intermediate_route['error']}")
        return intermediate_route

    print("=== Phase 2: Processing intermediate safer route ===")
    # Extract LineString from intermediate route
    intermediate_polyline = intermediate_route["routes"][0]["geometry"]
    intermediate_coords = polyline.decode(intermediate_polyline, geojson=True)

    # Create LineString for intermediate route
    intermediate_linestring_coords = ", ".join(
        [f"{coord[0]} {coord[1]}" for coord in intermediate_coords]
    )
    intermediate_linestring = f"LINESTRING({intermediate_linestring_coords})"

    # Phase 2: Get additional crime hotspots along the intermediate route
    # Use a different query that excludes already identified hotspots
    phase2_hotspots = get_additional_hotspots(
        intermediate_linestring, phase1_hotspots, limit=7
    )
    print(f"Found {len(phase2_hotspots)} additional hotspots along intermediate route")

    # Combine all hotspots
    all_hotspots = phase1_hotspots + phase2_hotspots
    print(f"Total hotspots to avoid: {len(all_hotspots)}")

    # Create final avoidance polygons
    final_polygons = create_avoid_polygons(all_hotspots)

    # Get final safer route avoiding all hotspots
    final_route = get_safer_ors_route(departure, destination, final_polygons)

    return final_route


def get_crime_hotspots(linestring, limit=10):
    """
    Query the database to find crime hotspots near a route,
    prioritizing both crime severity and proximity

    Args:
        linestring (str): WKT format linestring of the route
        limit (int): Maximum number of hotspots to return

    Returns:
        list: List of hotspot dictionaries
    """
    query = """
            SELECT
                ST_Y(wkb_geometry) AS latitude,
                ST_X(wkb_geometry) AS longitude,
                CMPLNT_NUM,
                ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) AS distance
            FROM filtered_grouped_data_centroid
            WHERE CMPLNT_NUM > 10
            ORDER BY
                -- Balance between proximity and crime intensity
                (
                    CMPLNT_NUM * 0.7
                ) / (
                    POWER(
                        ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) + 0.001,
                        1.5
                    )
                ) DESC
            LIMIT %s;
        """

    hotspots = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [linestring, linestring, limit])
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
                print(f"Hotspot with {complaints} complaints at distance {distance}")
    except Exception as e:
        print(f"Error querying the database: {str(e)}")

    return hotspots


def get_additional_hotspots(
    linestring, existing_hotspots, limit=10, min_distance=0.005
):
    """
    Query the database to find additional crime hotspots near a route,
    excluding hotspots that are too close to existing ones

    Args:
        linestring (str): WKT format linestring of the route
        existing_hotspots (list): List of hotspots already identified
        limit (int): Maximum number of additional hotspots to return
        min_distance (float): Minimum distance from existing hotspots in degrees

    Returns:
        list: List of additional hotspot dictionaries
    """
    # Create exclusion conditions for existing hotspots
    exclusion_conditions = []
    for hotspot in existing_hotspots:
        # Convert to postgis ST_DWithin
        lat, lon = hotspot["latitude"], hotspot["longitude"]
        condition = (
            "ST_DWithin("
            f"wkb_geometry, "
            f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326), "
            f"{min_distance}"
            ")"
        )
        exclusion_conditions.append(condition)

    # Build the WHERE clause
    where_clause = "CMPLNT_NUM > 10"
    if exclusion_conditions:
        where_clause += " AND NOT (" + " OR ".join(exclusion_conditions) + ")"

    query = f"""
        SELECT
            ST_Y(wkb_geometry) AS latitude,
            ST_X(wkb_geometry) AS longitude,
            CMPLNT_NUM,
            ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) AS distance
        FROM filtered_grouped_data_centroid
        WHERE {where_clause}
        ORDER BY
            -- Balance between proximity and crime intensity
            (
                CMPLNT_NUM * 0.7
            ) / (
                POWER(
                    ST_Distance(wkb_geometry, ST_GeomFromText(%s, 4326)) + 0.001,
                    1.5
                )
            ) DESC
        LIMIT %s;
    """

    hotspots = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, [linestring, linestring, limit])
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
        print(f"Error querying additional hotspots: {str(e)}")

    return hotspots


def create_avoid_polygons(hotspots, radius=0.3):
    """
    Create Shapely Polygons around crime hotspots using proper buffering

    Args:
        hotspots (list): Crime hotspot points
        radius (float): Base radius in kilometers for avoidance area

    Returns:
        MultiPolygon: Shapely MultiPolygon of areas to avoid
    """
    polygon_list = []

    # Define projections for NYC area
    wgs84 = pyproj.CRS("EPSG:4326")  # WGS84 coordinate system
    utm = pyproj.CRS("EPSG:26918")  # UTM zone 18N (appropriate for NYC)

    # Define transformations
    project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
    project_back = pyproj.Transformer.from_crs(utm, wgs84, always_xy=True).transform

    for i, hotspot in enumerate(hotspots):
        # Scale radius based on complaints (crime intensity)
        scaled_radius = max(0.3, radius * (1 + (hotspot["complaints"] / 80)))
        # Create point in WGS84
        point = Point(hotspot["longitude"], hotspot["latitude"])

        # Transform point to UTM, buffer, then transform back to WGS84
        point_utm = transform(project, point)
        buffer_utm = point_utm.buffer(scaled_radius * 1000)  # buffer in meters
        buffer_wgs84 = transform(project_back, buffer_utm)

        # Simplify to reduce complexity (helps with API request size)
        simplified = buffer_wgs84.simplify(0.0001)
        polygon_list.append(simplified)

    # Create MultiPolygon from all polygons
    if polygon_list:
        multi_poly = MultiPolygon(polygon_list)
        return multi_poly
    else:
        print("No polygon areas created for avoidance")
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
        # Convert MultiPolygon to GeoJSON
        avoid_geojson = geometry.mapping(avoid_polygons)
        body["options"] = {"avoid_polygons": avoid_geojson}

    try:
        response = requests.post(map_url, json=body, headers=headers)

        if not response.ok:
            print(f"Error response from ORS: {response.status_code}")
            # If the request is too large, try reducing the number of polygons
            if response.status_code == 413:
                print("Request too large, trying with fewer polygons...")
                if avoid_polygons and len(avoid_polygons.geoms) > 5:
                    # Take the most important polygons (first ones)
                    reduced_polygons = MultiPolygon(list(avoid_polygons.geoms)[:5])
                    return get_safer_ors_route(departure, destination, reduced_polygons)

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting safer ORS route: {str(e)}")
        return {"error": f"Error processing route request: {str(e)}"}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}
