import os
from rest_framework import generics, status, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import SavedRoute, IssueOnLocationReport
from .serializers import (
    RouteInputSerializer,
    SavedRouteSerializer,
    SavedRouteUpdateSerializer,
    IssueOnLocationListSerializer,
    CreateIssueOnLocationReportSerializer,
)
import requests
from django.db import connection
import polyline
from shapely import geometry
from shapely.geometry import Point, MultiPolygon
from shapely.ops import transform
import pyproj
import json


class HeatmapDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            # Get the data type from query parameters (1 = primary, 2 = secondary)
            data_type = request.query_params.get("type", "1")

            # Validate data_type parameter
            if data_type not in ["1", "2", "primary", "secondary"]:
                return Response(
                    {"error": "Invalid type parameter"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            is_primary = data_type in ["1", "primary"]
            operator_sql = ">=" if is_primary else "<"
            threshold = 5

            with connection.cursor() as cursor:
                cursor.execute(
                    f"""SELECT ST_Y(wkb_geometry) AS latitude,
                    ST_X(wkb_geometry) AS longitude,
                    CMPLNT_NUM
                    FROM filtered_grouped_data_centroid
                    WHERE CMPLNT_NUM {operator_sql} %s;""",
                    [threshold],
                )

                heatmap_points = []
                for row in cursor.fetchall():
                    latitude, longitude, complaints = row
                    try:
                        complaints = (
                            float(complaints) if complaints is not None else 0.0
                        )
                    except (ValueError, TypeError):
                        complaints = 0.0

                    heatmap_points.append(
                        {
                            "latitude": latitude,
                            "longitude": longitude,
                            "intensity": complaints,
                        }
                    )

            return Response(heatmap_points)

        except Exception as error:
            print("Error while fetching data from PostgreSQL: %s", error)
            return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PrimaryHeatmapDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT ST_Y(wkb_geometry) AS latitude,
                    ST_X(wkb_geometry) AS longitude,
                    CMPLNT_NUM
                    FROM filtered_grouped_data_centroid
                    WHERE CMPLNT_NUM >= %s;""",
                    [5],
                )

                heatmap_points = []
                for row in cursor.fetchall():
                    latitude, longitude, complaints = row
                    try:
                        complaints = (
                            float(complaints) if complaints is not None else 0.0
                        )
                    except (ValueError, TypeError):
                        complaints = 0.0

                    heatmap_points.append(
                        {
                            "latitude": latitude,
                            "longitude": longitude,
                            "intensity": complaints,
                        }
                    )

            return Response(heatmap_points)

        except Exception as error:
            print("Error while fetching data from PostgreSQL: %s", error)
            return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SecondaryHeatmapDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT ST_Y(wkb_geometry) AS latitude,
                    ST_X(wkb_geometry) AS longitude,
                    CMPLNT_NUM
                    FROM filtered_grouped_data_centroid
                    WHERE CMPLNT_NUM < %s;""",
                    [5],
                )

                heatmap_points = []
                for row in cursor.fetchall():
                    latitude, longitude, complaints = row
                    try:
                        complaints = (
                            float(complaints) if complaints is not None else 0.0
                        )
                    except (ValueError, TypeError):
                        complaints = 0.0

                    heatmap_points.append(
                        {
                            "latitude": latitude,
                            "longitude": longitude,
                            "intensity": complaints,
                        }
                    )

            return Response(heatmap_points)

        except Exception as error:
            print("Error while fetching data from PostgreSQL: %s", error)
            return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaveRouteAPIView(generics.GenericAPIView):
    serializer_class = SavedRouteSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
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
            print("There was an error generating the safer route: ", str(e))
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


def process_route_with_crime_data(initial_route):
    """
    Two-phase process to create a safer route with Phase 1 fallback:
    1. First identify crime hotspots along the initial route
    2. Create a safer route avoiding those hotspots (Phase 1)
    3. Find additional hotspots along this safer route
    4. Try to create a final safer route avoiding all identified hotspots
    5. If Phase 2 fails, return the Phase 1 route

    Args:
        initial_route (dict): The initial route from ORS
    Returns:
        dict: The safer route that avoids crime hotspots
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

    # Successfully got an intermediate route, store it as a potential fallback
    phase1_route = intermediate_route

    # Add metadata to indicate this is a Phase 1 route with limited avoidance
    if "metadata" not in phase1_route:
        phase1_route["metadata"] = {}
    phase1_route["metadata"]["phase"] = "Phase 1"
    phase1_route["metadata"]["avoided_hotspots"] = len(phase1_hotspots)

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
    phase2_hotspots = get_additional_hotspots(
        intermediate_linestring, phase1_hotspots, limit=7
    )
    print(f"Found {len(phase2_hotspots)} additional hotspots along intermediate route")

    # Combine all hotspots
    all_hotspots = phase1_hotspots + phase2_hotspots
    print(f"Total hotspots to avoid: {len(all_hotspots)}")

    # Create final avoidance polygons
    final_polygons = create_avoid_polygons(all_hotspots)

    # Attempt to get final safer route avoiding all hotspots
    final_route = get_safer_ors_route(departure, destination, final_polygons)

    # If Phase 2 route generation failed, return the Phase 1 route instead
    if "error" in final_route or not final_route:
        print("Phase 2 route failed, falling back to Phase 1 route")
        return phase1_route

    # Add metadata to final route to indicate full avoidance
    if "metadata" not in final_route:
        final_route["metadata"] = {}
    final_route["metadata"]["phase"] = "Phase 2"
    final_route["metadata"]["avoided_hotspots"] = len(all_hotspots)

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
            WHERE CMPLNT_NUM >= 5
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


def create_avoid_polygons(hotspots, base_radius=0.10):
    """
    Create Shapely Polygons around crime hotspots using proper buffering
    Optimized for NYC's dense urban environment

    Args:
        hotspots (list): Crime hotspot points
        base_radius (float): Base radius in kilometers for avoidance area (default 100m)

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

    # NYC-specific radius settings
    min_radius = 0.08  # 80 meters (approximately one short NYC block)
    max_radius = 0.20  # 200 meters (less than one long NYC block)

    # NYC avg block dimensions: short side ~80m, long side ~270m

    for i, hotspot in enumerate(hotspots):
        # Scale radius based on complaints with NYC-calibrated formula
        # More gradual scaling that caps at a reasonable maximum
        complaint_factor = min(1.0, hotspot["complaints"] / 100)
        scaled_radius = min_radius + (max_radius - min_radius) * complaint_factor

        # Create point in WGS84
        point = Point(hotspot["longitude"], hotspot["latitude"])

        # Transform point to UTM, buffer, then transform back to WGS84
        point_utm = transform(project, point)
        buffer_utm = point_utm.buffer(scaled_radius * 1000)  # buffer in meters
        buffer_wgs84 = transform(project_back, buffer_utm)

        # Simplify to reduce complexity (helps with API request size)
        # Increased simplification tolerance slightly for NYC's dense geometry
        simplified = buffer_wgs84.simplify(0.0002)
        polygon_list.append(simplified)

    # Create MultiPolygon from all polygons
    if polygon_list:
        multi_poly = MultiPolygon(polygon_list)
        return multi_poly
    else:
        print("No polygon areas created for avoidance")
        return None


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
    where_clause = "CMPLNT_NUM >= 5"
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


def get_safer_ors_route(departure, destination, avoid_polygons):
    """
    Get a route from OpenRouteService that avoids specified areas
    Returns error if route cannot be found instead of falling back

    Args:
        departure (list): Starting point coordinates [longitude, latitude]
        destination (list): Ending point coordinates [longitude, latitude]
        avoid_polygons (MultiPolygon): Shapely MultiPolygon of areas to avoid

    Returns:
        dict: The OpenRouteService Directions API response or error
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
        # Safe way to get polygon count, works with all Shapely versions
        try:
            # Try accessing the geoms attribute (newer Shapely versions)
            if hasattr(avoid_polygons, "geoms"):
                polygons = list(avoid_polygons.geoms)
                poly_count = len(polygons)
            # Try iterating (older Shapely versions)
            else:
                polygons = list(avoid_polygons)
                poly_count = len(polygons)

            print(f"Using {poly_count} polygons for avoidance")

            if poly_count > 3:
                print(f"... and {poly_count - 3} more polygons")

        except Exception as e:
            # If we can't iterate or access, just log what we can
            print(f"MultiPolygon info - Type: {type(avoid_polygons)}")
            print(f"Warning: Could not inspect polygons: {str(e)}")

        # Convert MultiPolygon to GeoJSON
        try:
            avoid_geojson = geometry.mapping(avoid_polygons)
            geojson_str = json.dumps(avoid_geojson)
            print(f"Avoid polygons GeoJSON size: {len(geojson_str)} bytes")

            body["options"] = {"avoid_polygons": avoid_geojson}
        except Exception as e:
            print(f"Error converting to GeoJSON: {str(e)}")
            return {"error": f"Error converting polygons to GeoJSON: {str(e)}"}

    # Log request details
    print("Request to ORS API:")
    print(f"- Departure: {departure}")
    print(f"- Destination: {destination}")

    try:
        # Send the request
        response = requests.post(map_url, json=body, headers=headers)

        # Log response basics
        print(f"ORS API Response: Status {response.status_code}")

        if not response.ok:
            # Log error details and return the error (no fallback)
            error_text = response.text[:500] if response.text else "No error text"
            print(f"Error response body: {error_text}")
            return {
                "error": f"OpenRouteService API error: "
                f"{response.status_code} - {error_text}"
            }

        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error getting safer ORS route: {str(e)}")
        return {"error": f"Error processing route request: {str(e)}"}

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}


class IssueOnLocationReportListView(generics.ListAPIView):
    pagination_class = RoutesPagination
    permission_classes = (IsAuthenticated,)
    serializer_class = IssueOnLocationListSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']  # Allow filtering by status
    ordering_fields = ['created_at']  # Allow ordering by created_at
    ordering = ['-created_at']  # Default ordering

    def get_queryset(self):
        return IssueOnLocationReport.objects.filter(user=self.request.user)


class CreateIssueOnLocationReportView(generics.GenericAPIView):
    serializer_class = CreateIssueOnLocationReportSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"user": self.request.user}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "success": "Thank you for your report!! It will be available for review in no time"
            }
        )


class DeleteIssueOnLocationReportView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = IssueOnLocationListSerializer

    def get_queryset(self):
        # Only allow users to delete their own reports
        return IssueOnLocationReport.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Extra check to ensure the user owns this report
        if instance.user != request.user:
            return Response(
                {"detail": "You do not have permission to delete this report."},
                status=status.HTTP_403_FORBIDDEN
            )

        # self.perform_destroy(instance)
        return Response(
            {"detail": "Report deleted successfully."},
            status=status.HTTP_200_OK
        )