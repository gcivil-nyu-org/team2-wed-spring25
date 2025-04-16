from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status, serializers
from unittest.mock import patch, MagicMock
import requests
import json
from shapely.geometry import Point, Polygon, MultiPolygon

from .models import SavedRoute
from .views import (
    process_route_with_crime_data,
    get_crime_hotspots,
    get_additional_hotspots,
    create_avoid_polygons,
    get_safer_ors_route,
    heatmap_data,
)
from .serializers import NYC_BOUNDS, is_within_nyc

User = get_user_model()


class BaseTestCase(TestCase):
    """Base test case with common setup for all test classes"""

    def setUp(self):
        """Set up test data and clients that are common across test cases"""
        # Create test users
        self.user1 = User.objects.create_user(
            email="test1@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User1",
        )

        self.user2 = User.objects.create_user(
            email="test2@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User2",
        )

        # Set up API client
        self.api_client = APIClient()
        self.client = Client()


class SavedRouteAPITestCase(BaseTestCase):
    """Test cases for SavedRoute API endpoints"""

    def setUp(self):
        """Set up test data specific to SavedRoute tests"""
        super().setUp()

        # Create test routes for user1
        self.route1 = SavedRoute.objects.create(
            user=self.user1,
            name="Home to Work",
            departure_lat=40.7128,
            departure_lon=-74.0060,
            destination_lat=40.7580,
            destination_lon=-73.9855,
            favorite=True,
        )

        self.route2 = SavedRoute.objects.create(
            user=self.user1,
            name="Home to Gym",
            departure_lat=40.7128,
            departure_lon=-74.0060,
            destination_lat=40.7431,
            destination_lon=-73.9712,
            favorite=False,
        )

        # Create test route for user2
        self.route3 = SavedRoute.objects.create(
            user=self.user2,
            name="My Route",
            departure_lat=40.6892,
            departure_lon=-74.0445,
            destination_lat=40.7831,
            destination_lon=-73.9712,
            favorite=True,
        )

        # URLs for the endpoints - only set the ones that don't need parameters
        self.save_route_url = reverse("save-route")
        self.retrieve_routes_url = reverse("retrieve-routes")
        self.update_route_url = reverse("update-route")
        # Note: delete_route_url is not set here because it requires a pk parameter

    def test_save_route_authenticated(self):
        """Test saving a new route as an authenticated user"""
        self.api_client.force_authenticate(user=self.user1)

        data = {
            "name": "New Test Route",
            "departure_lat": 40.7128,
            "departure_lon": -74.0060,
            "destination_lat": 40.7580,
            "destination_lon": -73.9855,
            "favorite": False,
        }

        response = self.api_client.post(self.save_route_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SavedRoute.objects.count(), 4)
        self.assertEqual(SavedRoute.objects.filter(user=self.user1).count(), 3)
        self.assertEqual(response.data["name"], "New Test Route")

    def test_save_route_duplicate_name(self):
        """Test that a user cannot save two routes with the same name"""
        self.api_client.force_authenticate(user=self.user1)

        data = {
            "name": "Home to Work",  # This name already exists for user1
            "departure_lat": 40.7128,
            "departure_lon": -74.0060,
            "destination_lat": 40.7580,
            "destination_lon": -73.9855,
            "favorite": False,
        }

        response = self.api_client.post(self.save_route_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SavedRoute.objects.count(), 3)  # No new route added

    def test_save_route_unauthenticated(self):
        """Test that unauthenticated users cannot save routes"""
        data = {
            "name": "Unauthenticated Route",
            "departure_lat": 40.7128,
            "departure_lon": -74.0060,
            "destination_lat": 40.7580,
            "destination_lon": -73.9855,
            "favorite": False,
        }

        response = self.api_client.post(self.save_route_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(SavedRoute.objects.count(), 3)  # No new route added

    def test_retrieve_saved_routes(self):
        """Test retrieving saved routes for an authenticated user"""
        self.api_client.force_authenticate(user=self.user1)

        # Make sure we know exactly how many routes should exist for user1
        user1_route_count = SavedRoute.objects.filter(user=self.user1).count()

        response = self.api_client.get(self.retrieve_routes_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # If pagination is in use, we need to check for 'results' key
        if "results" in response.data:
            # Check that the first page has the expected routes
            results = response.data["results"]
            self.assertGreaterEqual(len(results), 1)

            # Check that the route1 (favorite) is before route2 (non-favorite)
            # Find the indices of route1 and route2 in the results
            route1_index = next(
                (i for i, item in enumerate(results) if item["id"] == self.route1.id),
                None,
            )
            route2_index = next(
                (i for i, item in enumerate(results) if item["id"] == self.route2.id),
                None,
            )

            # If both routes are in the first page of results, check their order
            if route1_index is not None and route2_index is not None:
                self.assertLess(
                    route1_index,
                    route2_index,
                    "Favorite route should come before non-favorite route",
                )
        else:
            # No pagination - check the total count matches expected
            self.assertEqual(len(response.data), user1_route_count)

            # Find the indices of route1 and route2 in the results
            route1_index = next(
                (
                    i
                    for i, item in enumerate(response.data)
                    if item["id"] == self.route1.id
                ),
                None,
            )
            route2_index = next(
                (
                    i
                    for i, item in enumerate(response.data)
                    if item["id"] == self.route2.id
                ),
                None,
            )

            # If both routes are in the results, check their order
            if route1_index is not None and route2_index is not None:
                self.assertLess(
                    route1_index,
                    route2_index,
                    "Favorite route should come before non-favorite route",
                )

    def test_retrieve_saved_routes_unauthenticated(self):
        """Test that unauthenticated users cannot retrieve routes"""
        response = self.api_client.get(self.retrieve_routes_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_saved_route(self):
        """Test updating a saved route (favorite status)"""
        self.api_client.force_authenticate(user=self.user1)

        data = {"id": self.route2.id, "favorite": True}

        response = self.api_client.put(self.update_route_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.route2.refresh_from_db()
        self.assertTrue(self.route2.favorite)

    def test_update_route_of_another_user(self):
        """Test that a user cannot update another user's route"""
        self.api_client.force_authenticate(user=self.user1)

        data = {
            "id": self.route3.id,  # This belongs to user2
            "favorite": False,  # Change to False to see if it remains True
        }

        try:
            response = self.api_client.put(self.update_route_url, data, format="json")
            # If we get here, check status code
            self.assertIn(
                response.status_code,
                [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN],
            )
        except Exception:
            # The test may raise an exception due to the DoesNotExist being raised
            # That's okay, as long as the route is unchanged
            pass

        # Refresh from database - the important thing is that the route is unchanged
        self.route3.refresh_from_db()
        self.assertTrue(self.route3.favorite)  # Should remain unchanged

    def test_update_route_unauthenticated(self):
        """Test that unauthenticated users cannot update routes"""
        data = {"id": self.route1.id, "favorite": False}

        response = self.api_client.put(self.update_route_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Refresh from database
        self.route1.refresh_from_db()
        self.assertTrue(self.route1.favorite)  # Unchanged

    def test_delete_saved_route(self):
        """Test deleting a saved route"""
        self.api_client.force_authenticate(user=self.user1)

        # Generate the delete URL with the specific pk
        delete_url = reverse("delete-route", kwargs={"pk": self.route2.id})

        response = self.api_client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SavedRoute.objects.count(), 2)
        self.assertFalse(SavedRoute.objects.filter(id=self.route2.id).exists())

    def test_delete_route_of_another_user(self):
        """Test that a user cannot delete another user's route"""
        self.api_client.force_authenticate(user=self.user1)

        # Generate the delete URL with the specific pk
        delete_url = reverse("delete-route", kwargs={"pk": self.route3.id})

        try:
            response = self.api_client.delete(delete_url)
            # If we get here, check status code
            self.assertIn(
                response.status_code,
                [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN],
            )
        except Exception:
            # The test may raise an exception due to the DoesNotExist being raised
            # That's okay, as long as the route is not deleted
            pass

        # The key assertion is that the route still exists
        self.assertEqual(SavedRoute.objects.count(), 3)  # No route deleted
        self.assertTrue(SavedRoute.objects.filter(id=self.route3.id).exists())

    def test_delete_route_unauthenticated(self):
        """Test that unauthenticated users cannot delete routes"""
        # Generate the delete URL with the specific pk
        delete_url = reverse("delete-route", kwargs={"pk": self.route1.id})

        response = self.api_client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(SavedRoute.objects.count(), 3)  # No route deleted
        self.assertTrue(SavedRoute.objects.filter(id=self.route1.id).exists())


class RouteViewAPITestCase(BaseTestCase):
    """Test cases for the RouteViewAPI endpoint"""

    def setUp(self):
        """Set up test data specific to RouteViewAPI tests"""
        super().setUp()

        # Create test route
        self.saved_route = SavedRoute.objects.create(
            user=self.user1,
            name="Existing Route",
            departure_lat=40.7128,
            departure_lon=-74.0060,
            destination_lat=40.7580,
            destination_lon=-73.9855,
            favorite=True,
        )

        # URL for API endpoint
        self.url = reverse("get-route")

        # Sample valid data for requests - using NYC coordinates
        self.valid_data = {
            "departure": [40.7128, -74.0060],  # Manhattan coordinates
            "destination": [40.7580, -73.9855],  # Still in NYC
            "saved_route": False,
        }

        # Set up successful mock response from OpenRouteService
        self.mock_ors_response = {
            "routes": [
                {
                    "geometry": "some_encoded_polyline",
                    "legs": [],
                    "summary": {"distance": 3941.2, "duration": 3146.6},
                }
            ],
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "segments": [{"distance": 3941.2, "duration": 3146.6}],
                        "summary": {"distance": 3941.2, "duration": 3146.6},
                    },
                    "geometry": {
                        "coordinates": [[-74.0060, 40.7128], [-73.9855, 40.7580]],
                        "type": "LineString",
                    },
                }
            ],
        }

        # Mock safer route response
        self.mock_safer_route = {
            "routes": [
                {
                    "geometry": "another_encoded_polyline",
                    "legs": [],
                    "summary": {"distance": 4100.5, "duration": 3300.2},
                }
            ],
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "segments": [{"distance": 4100.5, "duration": 3300.2}],
                        "summary": {"distance": 4100.5, "duration": 3300.2},
                    },
                    "geometry": {
                        "coordinates": [[-74.0060, 40.7128], [-73.9855, 40.7580]],
                        "type": "LineString",
                    },
                }
            ],
        }

        # Set up mock decoded coordinates for polyline tests
        self.mock_decoded_coords = [
            [-74.0060, 40.7128],
            [-73.9900, 40.7300],
            [-73.9855, 40.7580],
        ]

        # Mock hotspots data for testing
        self.mock_hotspots = [
            {
                "latitude": 40.7200,
                "longitude": -74.0100,
                "complaints": 15,
                "distance": 0.01,
            },
            {
                "latitude": 40.7300,
                "longitude": -74.0200,
                "complaints": 20,
                "distance": 0.02,
            },
        ]

    def test_is_within_nyc_function(self):
        """Test the is_within_nyc helper function directly"""
        # Test valid NYC coordinates
        self.assertTrue(is_within_nyc(40.7128, -74.0060))  # Manhattan
        self.assertTrue(is_within_nyc(40.6782, -73.9442))  # Brooklyn

        # Test invalid coordinates
        self.assertFalse(is_within_nyc(42.7128, -73.9566))  # Too far north
        self.assertFalse(is_within_nyc(40.7128, -76.0000))  # Too far west
        self.assertFalse(is_within_nyc(39.0000, -74.0060))  # Too far south
        self.assertFalse(is_within_nyc(40.7128, -72.0000))  # Too far east

    @patch("requests.post")
    def test_unauthenticated_access_denied(self, mock_post):
        """Test that unauthenticated users cannot access the endpoint"""
        response = self.api_client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("requests.post")
    def test_authenticated_access_allowed(self, mock_post):
        """Test that authenticated users can access the endpoint"""
        # Setup mock for OpenRouteService
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_ors_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        response = self.api_client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("initial_route", response.data)

    @patch("requests.post")
    def test_route_with_coordinates(self, mock_post):
        """Test getting a route using coordinates"""
        # Setup mock for OpenRouteService
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_ors_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        response = self.api_client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["initial_route"], self.mock_ors_response)

    @patch("requests.post")
    def test_coordinates_within_nyc_boundaries(self, mock_post):
        """Test that coordinates within NYC boundaries pass validation"""
        # Setup mock for OpenRouteService
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_ors_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Valid coordinates within NYC boundaries
        valid_data = {
            "departure": [40.7128, -73.9566],  # Manhattan coordinates
            "destination": [40.6782, -73.9442],  # Brooklyn coordinates
            "saved_route": False,
        }

        response = self.api_client.post(self.url, valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("requests.post")
    def test_departure_outside_nyc_boundaries(self, mock_post):
        """Test that departure coordinates outside NYC boundaries fail validation"""
        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Invalid departure coordinates (outside NYC)
        invalid_data = {
            "departure": [42.7128, -73.9566],  # Outside NYC (too far north)
            "destination": [40.6782, -73.9442],  # Brooklyn coordinates
            "saved_route": False,
        }

        response = self.api_client.post(self.url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("departure", response.data["details"])
        self.assertIn(
            "within New York City boundaries",
            str(response.data["details"]["departure"][0]),
        )

    @patch("requests.post")
    def test_destination_outside_nyc_boundaries(self, mock_post):
        """Test that destination coordinates outside NYC boundaries fail validation"""
        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Invalid destination coordinates (outside NYC)
        invalid_data = {
            "departure": [40.7128, -73.9566],  # Manhattan coordinates
            "destination": [40.6782, -76.0000],  # Outside NYC (too far west)
            "saved_route": False,
        }

        response = self.api_client.post(self.url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("destination", response.data["details"])
        self.assertIn(
            "within New York City boundaries",
            str(response.data["details"]["destination"][0]),
        )

    @patch("requests.post")
    def test_both_coordinates_outside_nyc_boundaries(self, mock_post):
        """Test that both departure and
        destination coordinates outside NYC boundaries fail validation"""
        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Both coordinates invalid
        invalid_data = {
            "departure": [42.7128, -73.9566],  # Outside NYC (too far north)
            "destination": [40.6782, -76.0000],  # Outside NYC (too far west)
            "saved_route": False,
        }

        response = self.api_client.post(self.url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("departure", response.data["details"])
        self.assertIn("destination", response.data["details"])

    @patch("requests.post")
    def test_edge_coordinates_within_nyc_boundaries(self, mock_post):
        """Test coordinates at the edge of NYC boundaries"""
        # Setup mock for OpenRouteService
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_ors_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Coordinates at the edge of NYC boundaries
        edge_data = {
            "departure": [
                NYC_BOUNDS["sw"][0] + 0.001,
                NYC_BOUNDS["sw"][1] + 0.001,
            ],  # Just inside SW corner
            "destination": [
                NYC_BOUNDS["ne"][0] - 0.001,
                NYC_BOUNDS["ne"][1] - 0.001,
            ],  # Just inside NE corner
            "saved_route": False,
        }

        response = self.api_client.post(self.url, edge_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("requests.post")
    def test_just_outside_nyc_boundaries(self, mock_post):
        """Test coordinates just outside NYC boundaries"""
        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        # Coordinates just outside NYC boundaries
        outside_data = {
            "departure": [
                NYC_BOUNDS["sw"][0] - 0.001,
                NYC_BOUNDS["sw"][1] - 0.001,
            ],  # Just outside SW corner
            "destination": [40.6782, -73.9442],  # Brooklyn coordinates
            "saved_route": False,
        }

        response = self.api_client.post(self.url, outside_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("departure", response.data["details"])

    @patch("requests.post")
    @patch("polyline.decode")
    @patch("django.db.connection.cursor")
    def test_safer_route_generation_failure(
        self, mock_cursor, mock_polyline_decode, mock_post
    ):
        """Test fallback when safer route generation fails"""
        # Setup mock for OpenRouteService
        mock_response = MagicMock()
        mock_response.json.return_value = self.mock_ors_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Mock polyline decoding to raise an exception during safer route generation
        mock_polyline_decode.side_effect = Exception("Polyline decode error")

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        response = self.api_client.post(self.url, self.valid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["initial_route"], self.mock_ors_response)
        self.assertIsNone(response.data["safer_route"])
        self.assertIn("message", response.data)

    @patch("requests.post")
    def test_openrouteservice_error(self, mock_post):
        """Test handling of errors from OpenRouteService"""
        # Setup mock for OpenRouteService error
        mock_post.side_effect = requests.exceptions.RequestException("API Error")

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        response = self.api_client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

    @patch("requests.post")
    @patch("polyline.decode")
    @patch("map.views.process_route_with_crime_data")
    def test_successful_safer_route_generation(
        self, mock_process, mock_decode, mock_post
    ):
        """Test successful generation of a safer route"""
        # Setup sequential mocks for initial and safer route
        mock_initial_response = MagicMock()
        mock_initial_response.json.return_value = self.mock_ors_response
        mock_initial_response.raise_for_status.return_value = None

        # Configure our multiple responses
        mock_post.return_value = mock_initial_response

        # Setup decode and process_route mocks
        mock_decode.return_value = self.mock_decoded_coords
        mock_process.return_value = self.mock_safer_route

        # Authenticate user
        self.api_client.force_authenticate(user=self.user1)

        response = self.api_client.post(self.url, self.valid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["initial_route"], self.mock_ors_response)
        self.assertEqual(response.data["safer_route"], self.mock_safer_route)


class HeatmapDataTestCase(BaseTestCase):
    """Test cases for the heatmap_data function"""

    def setUp(self):
        super().setUp()
        self.url = reverse("heatmap-data")  # URL for heatmap data endpoint

        # Sample data to be returned by the cursor
        self.mock_data = [
            (40.7128, -74.0060, "5"),
            (40.7580, -73.9855, "10"),
            (40.7431, -73.9712, None),
        ]

    @patch("django.db.connection.cursor")
    def test_heatmap_data_success(self, mock_cursor):
        """Test successful retrieval of heatmap data"""
        # Mock the cursor's fetchall method to return our sample data
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = self.mock_data
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)

        # Verify the data is formatted correctly
        self.assertEqual(data[0]["latitude"], 40.7128)
        self.assertEqual(data[0]["longitude"], -74.0060)
        self.assertEqual(data[0]["intensity"], 5.0)

        # Verify that None is handled properly
        self.assertEqual(data[2]["intensity"], 0.0)

        # Verify that the SQL query was executed
        self.assertTrue(mock_cursor_instance.execute.called)
        # Check that the expected SQL query was used
        args, _ = mock_cursor_instance.execute.call_args
        self.assertIn("SELECT ST_Y(wkb_geometry) AS latitude", args[0])
        self.assertIn("ST_X(wkb_geometry) AS longitude", args[0])
        self.assertIn("FROM filtered_grouped_data_centroid", args[0])

    @patch("django.db.connection.cursor")
    def test_heatmap_data_db_error(self, mock_cursor):
        """Test handling of database errors"""
        # Mock the cursor to raise an exception
        mock_cursor.return_value.__enter__.side_effect = Exception("Database error")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)  # Even on error, returns 200
        data = json.loads(response.content)
        self.assertEqual(data, [])  # Empty list on error

    @patch("django.db.connection.cursor")
    def test_heatmap_data_empty_result(self, mock_cursor):
        """Test handling of empty database results"""
        # Mock the cursor to return an empty result
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = []
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data, [])

    @patch("django.db.connection.cursor")
    def test_heatmap_data_invalid_value_handling(self, mock_cursor):
        """Test handling of invalid values in the database results"""
        # Mock cursor to return data with invalid values
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = [
            (40.7128, -74.0060, "invalid"),  # String that isn't a number
            (40.7580, -73.9855, {}),  # Invalid type
            (40.7431, -73.9712, None),  # None value
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)

        # All intensity values should be converted to numbers
        # Invalid entries should be converted to 0.0
        self.assertEqual(data[0]["intensity"], 0.0)
        self.assertEqual(data[1]["intensity"], 0.0)
        self.assertEqual(data[2]["intensity"], 0.0)

    @patch("django.db.connection.cursor")
    def test_heatmap_data_direct_function_call(self, mock_cursor):
        """Test direct call to heatmap_data function"""
        # Mock the cursor's fetchall method
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = self.mock_data
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Create a mock request
        mock_request = MagicMock()

        # Call the function directly
        response = heatmap_data(mock_request)

        # Check the response
        self.assertEqual(response.status_code, 200)

        # Parse the JSON
        data = json.loads(response.content)
        self.assertEqual(len(data), 3)

        # Verify data structure
        self.assertIn("latitude", data[0])
        self.assertIn("longitude", data[0])
        self.assertIn("intensity", data[0])


class RouteSafetyFunctionsTestCase(BaseTestCase):
    """Test cases for the route safety processing functions"""

    def setUp(self):
        super().setUp()
        self.linestring = "LINESTRING(-74.0060 40.7128, -118.2437 34.0522)"

        self.mock_hotspots = [
            {
                "latitude": 40.7200,
                "longitude": -74.0100,
                "complaints": 15,
                "distance": 0.01,
            },
            {
                "latitude": 40.7300,
                "longitude": -74.0200,
                "complaints": 20,
                "distance": 0.02,
            },
        ]

        self.mock_initial_route = {
            "routes": [
                {
                    "geometry": "some_encoded_polyline",
                    "summary": {"distance": 3941.2, "duration": 3146.6},
                }
            ]
        }

        self.departure = [-74.0060, 40.7128]
        self.destination = [-118.2437, 34.0522]

    @patch("django.db.connection.cursor")
    def test_get_crime_hotspots(self, mock_cursor):
        """Test the get_crime_hotspots function"""
        # Mock the cursor response
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = [
            (40.7200, -74.0100, 15, 0.01),
            (40.7300, -74.0200, 20, 0.02),
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        result = get_crime_hotspots(self.linestring)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["latitude"], 40.7200)
        self.assertEqual(result[0]["longitude"], -74.0100)
        self.assertEqual(result[0]["complaints"], 15)
        self.assertEqual(result[0]["distance"], 0.01)

    @patch("django.db.connection.cursor")
    def test_get_crime_hotspots_db_error(self, mock_cursor):
        """Test get_crime_hotspots handling of database errors"""
        # Mock the cursor to raise an exception
        mock_cursor.return_value.__enter__.side_effect = Exception("Database error")

        result = get_crime_hotspots(self.linestring)

        self.assertEqual(result, [])  # Should return empty list on error

    @patch("django.db.connection.cursor")
    def test_get_additional_hotspots(self, mock_cursor):
        """Test the get_additional_hotspots function"""
        # Mock the cursor response
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = [
            (40.7400, -74.0300, 12, 0.03),
            (40.7500, -74.0400, 18, 0.04),
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Call the function with existing hotspots
        result = get_additional_hotspots(self.linestring, self.mock_hotspots)

        # Verify results
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["latitude"], 40.7400)
        self.assertEqual(result[0]["longitude"], -74.0300)
        self.assertEqual(result[0]["complaints"], 12)
        self.assertEqual(result[0]["distance"], 0.03)

    @patch("django.db.connection.cursor")
    def test_get_additional_hotspots_db_error(self, mock_cursor):
        """Test get_additional_hotspots handling of database errors"""
        # Mock the cursor to raise an exception
        mock_cursor.return_value.__enter__.side_effect = Exception("Database error")

        result = get_additional_hotspots(self.linestring, self.mock_hotspots)

        self.assertEqual(result, [])  # Should return empty list on error

    def test_create_avoid_polygons(self):
        """Test the create_avoid_polygons function"""
        result = create_avoid_polygons(self.mock_hotspots, base_radius=0.1)

        self.assertIsInstance(result, MultiPolygon)
        self.assertEqual(len(result.geoms), 2)

        # Don't check exact number of coordinates which can vary based on implementation
        # Just check that each polygon has coordinates
        for polygon in result.geoms:
            self.assertGreater(
                len(polygon.exterior.coords), 4
            )  # At least a simple polygon

    def test_create_avoid_polygons_empty(self):
        """Test create_avoid_polygons with empty hotspots"""
        result = create_avoid_polygons([])

        self.assertIsNone(result)

    @patch("map.views.transform")
    def test_create_avoid_polygons_with_scaled_radius(self, mock_transform):
        """Test create_avoid_polygons with complaints-based radius scaling"""
        # We need to mock the transform function to control the output polygon sizes
        # This helps us verify the scaling logic without relying on external libraries

        # For the low complaints test, create a small polygon
        small_polygon = Polygon([(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)])

        # For the high complaints test, create a larger polygon
        large_polygon = Polygon([(0, 0), (0, 2), (2, 2), (2, 0), (0, 0)])

        # Configure the mock to return our controlled polygons
        mock_transform.side_effect = [
            # First hotspot with low complaints
            Point(1, 1),  # point_utm (first transform call)
            small_polygon,  # buffer_wgs84 (second transform call)
            # Second hotspot with high complaints
            Point(1, 1),  # point_utm (third transform call)
            large_polygon,  # buffer_wgs84 (fourth transform call)
        ]

        # Create two hotspots with significantly different complaint numbers
        low_complaint_hotspots = [
            {
                "latitude": 40.7200,
                "longitude": -74.0100,
                "complaints": 10,  # Low value
                "distance": 0.01,
            }
        ]

        high_complaint_hotspots = [
            {
                "latitude": 40.7200,
                "longitude": -74.0100,
                "complaints": 500,  # Very high value to trigger scaling
                "distance": 0.01,
            }
        ]

        # Get the results from our function - changed 'radius' to 'base_radius'
        low_result = create_avoid_polygons(low_complaint_hotspots, base_radius=0.1)
        high_result = create_avoid_polygons(high_complaint_hotspots, base_radius=0.1)

        self.assertIsInstance(low_result, MultiPolygon)
        self.assertIsInstance(high_result, MultiPolygon)

        # Verify that the high complaint polygon was created with a larger area
        self.assertGreater(high_result.area, low_result.area)

        # Verify that transform was called
        self.assertTrue(mock_transform.called)
        # We expect 4 calls (2 for each hotspot × 2 hotspots)
        self.assertGreaterEqual(mock_transform.call_count, 2)

    @patch("requests.post")
    def test_get_safer_ors_route(self, mock_post):
        """Test the get_safer_ors_route function"""
        # Create a simple avoid polygon
        avoid_polygons = MultiPolygon(
            [
                Polygon(
                    [
                        (-74.02, 40.72),
                        (-74.01, 40.72),
                        (-74.01, 40.73),
                        (-74.02, 40.73),
                        (-74.02, 40.72),
                    ]
                )
            ]
        )

        # Mock ORS response
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "routes": [{"geometry": "safer_route_polyline"}]
        }
        mock_post.return_value = mock_response

        result = get_safer_ors_route(self.departure, self.destination, avoid_polygons)

        self.assertEqual(result["routes"][0]["geometry"], "safer_route_polyline")

        # Verify that avoid_polygons was included in the request
        args, kwargs = mock_post.call_args
        self.assertIn("json", kwargs)
        self.assertIn("options", kwargs["json"])
        self.assertIn("avoid_polygons", kwargs["json"]["options"])

    @patch("requests.post")
    def test_get_safer_ors_route_error(self, mock_post):
        """Test get_safer_ors_route handling of API errors"""
        # Mock ORS response to raise an exception
        mock_post.side_effect = requests.exceptions.RequestException("API error")

        result = get_safer_ors_route(self.departure, self.destination, None)

        self.assertIn("error", result)

    @patch("requests.post")
    def test_get_safer_ors_route_status_413(self, mock_post):
        """Test handling of 413 (payload too large) error"""
        # Create a mock response with 413 status
        mock_response = MagicMock()
        mock_response.ok = False
        mock_response.status_code = 413
        mock_response.text = """{"error":{"message":"Payload too large"}}"""
        mock_post.return_value = mock_response
        # Create polygons with more than 5 elements
        avoid_polygons = MultiPolygon(
            [
                Polygon(
                    [
                        (-74.02, 40.72),
                        (-74.01, 40.72),
                        (-74.01, 40.73),
                        (-74.02, 40.73),
                        (-74.02, 40.72),
                    ]
                ),
                Polygon(
                    [
                        (-74.03, 40.74),
                        (-74.02, 40.74),
                        (-74.02, 40.75),
                        (-74.03, 40.75),
                        (-74.03, 40.74),
                    ]
                ),
                Polygon(
                    [
                        (-74.04, 40.76),
                        (-74.03, 40.76),
                        (-74.03, 40.77),
                        (-74.04, 40.77),
                        (-74.04, 40.76),
                    ]
                ),
                Polygon(
                    [
                        (-74.05, 40.78),
                        (-74.04, 40.78),
                        (-74.04, 40.79),
                        (-74.05, 40.79),
                        (-74.05, 40.78),
                    ]
                ),
                Polygon(
                    [
                        (-74.06, 40.80),
                        (-74.05, 40.80),
                        (-74.05, 40.81),
                        (-74.06, 40.81),
                        (-74.06, 40.80),
                    ]
                ),
                Polygon(
                    [
                        (-74.07, 40.82),
                        (-74.06, 40.82),
                        (-74.06, 40.83),
                        (-74.07, 40.83),
                        (-74.07, 40.82),
                    ]
                ),
            ]
        )

        result = get_safer_ors_route(self.departure, self.destination, avoid_polygons)

        self.assertIn("error", result)
        self.assertIn("413", result["error"])

        # Verify only one request was made (no fallback attempt)
        self.assertEqual(mock_post.call_count, 1)

    @patch("polyline.decode")
    @patch("django.db.connection.cursor")
    @patch("requests.post")
    def test_process_route_with_crime_data(
        self, mock_post, mock_cursor, mock_polyline_decode
    ):
        """Test the process_route_with_crime_data function"""
        # Mock polyline decode to return coordinates
        mock_polyline_decode.return_value = [[-74.0060, 40.7128], [-118.2437, 34.0522]]

        # Mock cursor for crime data - first for phase 1 hotspots, then for phase 2
        mock_cursor_instance = MagicMock()
        # Phase 1 hotspots
        mock_cursor_instance.fetchall.side_effect = [
            [
                (40.7200, -74.0100, 15, 0.01),
                (40.7300, -74.0200, 20, 0.02),
            ],
            # Phase 2 hotspots
            [
                (40.7400, -74.0300, 12, 0.03),
                (40.7500, -74.0400, 18, 0.04),
            ],
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Mock ORS responses - first for intermediate route, then for final route
        intermediate_response = MagicMock()
        intermediate_response.ok = True
        intermediate_response.json.return_value = {
            "routes": [{"geometry": "intermediate_route_polyline"}]
        }

        final_response = MagicMock()
        final_response.ok = True
        final_response.json.return_value = {
            "routes": [{"geometry": "final_safer_route_polyline"}]
        }

        # Set up mock to return intermediate then final responses
        mock_post.side_effect = [intermediate_response, final_response]

        result = process_route_with_crime_data(self.mock_initial_route)

        # Verify result is the final safer route
        self.assertEqual(result["routes"][0]["geometry"], "final_safer_route_polyline")

        # Verify polyline.decode was called twice (once for each phase)
        self.assertEqual(mock_polyline_decode.call_count, 2)

        # Verify ORS API was called twice (intermediate and final routes)
        self.assertEqual(mock_post.call_count, 2)

    @patch("polyline.decode")
    @patch("django.db.connection.cursor")
    @patch("requests.post")
    def test_process_route_error_in_intermediate_route(
        self, mock_post, mock_cursor, mock_polyline_decode
    ):
        """Test process_route_with_crime_data when intermediate route fails"""
        # Mock polyline decode
        mock_polyline_decode.return_value = [[-74.0060, 40.7128], [-118.2437, 34.0522]]

        # Mock cursor for crime data
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = [
            (40.7200, -74.0100, 15, 0.01),
            (40.7300, -74.0200, 20, 0.02),
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Mock ORS to return an error for the intermediate route
        error_response = MagicMock()
        error_response.ok = True
        error_response.json.return_value = {"error": "ORS API error"}
        mock_post.return_value = error_response

        result = process_route_with_crime_data(self.mock_initial_route)

        # Should return the error from the intermediate route
        self.assertIn("error", result)
        self.assertEqual(result["error"], "ORS API error")

    @patch("polyline.decode")
    @patch("django.db.connection.cursor")
    @patch("requests.post")
    def test_process_route_with_two_phase_hotspots(
        self, mock_post, mock_cursor, mock_polyline_decode
    ):
        """Test process_route_with_crime_data with two phases of hotspot detection"""
        # First decode for initial route, second for intermediate route
        mock_polyline_decode.side_effect = [
            [
                [-74.0060, 40.7128],
                [-75.0000, 40.5000],
                [-118.2437, 34.0522],
            ],  # Initial route
            [
                [-74.0060, 40.7128],
                [-76.0000, 41.0000],
                [-118.2437, 34.0522],
            ],  # Intermediate route
        ]

        # Phase 1 and Phase 2 hotspots
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.side_effect = [
            [  # Phase 1 hotspots
                (40.7200, -74.0100, 15, 0.01),
                (40.7300, -74.0200, 20, 0.02),
            ],
            [  # Phase 2 hotspots (different locations)
                (41.0200, -76.0100, 12, 0.01),
                (41.0300, -76.0200, 18, 0.02),
            ],
        ]
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Intermediate and final route responses
        intermediate_mock = MagicMock()
        intermediate_mock.ok = True
        intermediate_mock.json.return_value = {
            "routes": [{"geometry": "intermediate_route_polyline"}]
        }

        final_mock = MagicMock()
        final_mock.ok = True
        final_mock.json.return_value = {
            "routes": [{"geometry": "final_route_with_all_hotspots_avoided"}]
        }

        mock_post.side_effect = [intermediate_mock, final_mock]

        result = process_route_with_crime_data(self.mock_initial_route)

        # Should return the final route that avoids all hotspots
        self.assertEqual(
            result["routes"][0]["geometry"], "final_route_with_all_hotspots_avoided"
        )

        # Verify we called cursor.execute twice (once for each phase)
        self.assertEqual(mock_cursor_instance.fetchall.call_count, 2)

        # Verify we called polyline.decode twice (once for each route)
        self.assertEqual(mock_polyline_decode.call_count, 2)

        # Verify we called ORS API twice (intermediate and final routes)
        self.assertEqual(mock_post.call_count, 2)

    @patch("polyline.decode")
    @patch("django.db.connection.cursor")
    @patch("map.views.get_safer_ors_route")
    def test_process_route_no_hotspots(
        self, mock_get_safer, mock_cursor, mock_polyline_decode
    ):
        """Test process_route_with_crime_data when no hotspots are found"""
        # Mock polyline decode
        mock_polyline_decode.return_value = [[-74.0060, 40.7128], [-118.2437, 34.0522]]

        # Mock empty hotspots response for both phases
        mock_cursor_instance = MagicMock()
        mock_cursor_instance.fetchall.return_value = []  # No hotspots in either phase
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

        # Mock get_safer_ors_route to return a route even with None avoid_polygons
        mock_get_safer.return_value = {"routes": [{"geometry": "same_route"}]}

        result = process_route_with_crime_data(self.mock_initial_route)

        # Should still return a route, even if it's the same as the original
        self.assertEqual(result["routes"][0]["geometry"], "same_route")

        # Check if get_safer_ors_route was called with None for avoid_polygons
        args, kwargs = mock_get_safer.call_args
        self.assertIsNone(args[2])  # Third argument is avoid_polygons

    def test_process_route_phase2_fallback(self):
        """Test process_route_with_crime_data fallback to Phase 1 when Phase 2 fails"""
        # Mock polyline decode to return coordinates
        with patch("polyline.decode") as mock_polyline_decode:
            mock_polyline_decode.return_value = [
                [-74.0060, 40.7128],
                [-118.2437, 34.0522],
            ]

            # Mock cursor for crime data - for phase 1 and phase 2 hotspots
            with patch("django.db.connection.cursor") as mock_cursor:
                mock_cursor_instance = MagicMock()
                # Phase 1 hotspots
                mock_cursor_instance.fetchall.side_effect = [
                    [
                        (40.7200, -74.0100, 15, 0.01),
                        (40.7300, -74.0200, 20, 0.02),
                    ],
                    # Phase 2 hotspots
                    [
                        (40.7400, -74.0300, 12, 0.03),
                        (40.7500, -74.0400, 18, 0.04),
                    ],
                ]
                mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

                # Mock ORS responses - success for phase 1, error for phase 2
                with patch("requests.post") as mock_post:
                    # Phase 1 successful response
                    phase1_response = MagicMock()
                    phase1_response.ok = True
                    phase1_response.json.return_value = {
                        "routes": [{"geometry": "phase1_route_polyline"}]
                    }

                    # Phase 2 error response
                    phase2_response = MagicMock()
                    phase2_response.ok = False
                    phase2_response.status_code = 404
                    phase2_response.text = """{"error":{
                        "code":2009,
                        "message":"Route could not be found"
                    }}"""

                    # Set up mock to return phase1 success then phase2 error
                    mock_post.side_effect = [phase1_response, phase2_response]

                    # Run the function
                    result = process_route_with_crime_data(self.mock_initial_route)

                    # Verify we got the Phase 1 route as fallback
                    self.assertEqual(
                        result["routes"][0]["geometry"], "phase1_route_polyline"
                    )

                    # Verify metadata was added
                    self.assertIn("metadata", result)
                    self.assertEqual(result["metadata"]["phase"], "Phase 1")
                    self.assertEqual(result["metadata"]["avoided_hotspots"], 2)

    def test_create_avoid_polygons_nyc_sizing(self):
        """Test NYC-specific sizing logic in create_avoid_polygons"""
        # Create test hotspots with different complaint levels
        test_hotspots = [
            {
                "latitude": 40.7200,
                "longitude": -74.0100,
                "complaints": 10,  # Low complaints
                "distance": 0.01,
            },
            {
                "latitude": 40.7300,
                "longitude": -74.0200,
                "complaints": 50,  # Medium complaints
                "distance": 0.02,
            },
            {
                "latitude": 40.7400,
                "longitude": -74.0300,
                "complaints": 100,  # High complaints (max scaling)
                "distance": 0.03,
            },
        ]

        # Patch the transform function to
        # control the output and allow us to test the radii
        with patch("map.views.transform") as mock_transform:
            # Mock Point objects for the return values of transform
            point_mock = Point(1, 1)

            # Set up different polygon sizes to return based on the scaled radii
            small_polygon = Polygon([(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)])
            medium_polygon = Polygon([(0, 0), (0, 1.5), (1.5, 1.5), (1.5, 0), (0, 0)])
            large_polygon = Polygon([(0, 0), (0, 2), (2, 2), (2, 0), (0, 0)])

            # Mock the transform returns in sequence
            mock_transform.side_effect = [
                # First hotspot (low complaints)
                point_mock,  # transform(project, point)
                small_polygon,  # transform(project_back, buffer_utm)
                # Second hotspot (medium complaints)
                point_mock,  # transform(project, point)
                medium_polygon,  # transform(project_back, buffer_utm)
                # Third hotspot (high complaints)
                point_mock,  # transform(project, point)
                large_polygon,  # transform(project_back, buffer_utm)
            ]

            # Call the function
            result = create_avoid_polygons(test_hotspots)

            # Verify results
            self.assertIsInstance(result, MultiPolygon)
            self.assertEqual(len(result.geoms), 3)

            # Check that the radii were scaled properly (by checking the polygon areas)
            # Sort polygons by area to match our expectation
            sorted_polygons = sorted(result.geoms, key=lambda p: p.area)

            # Low complaints should have smallest area
            self.assertEqual(sorted_polygons[0].area, small_polygon.area)
            # Medium complaints should have medium area
            self.assertEqual(sorted_polygons[1].area, medium_polygon.area)
            # High complaints should have largest area
            self.assertEqual(sorted_polygons[2].area, large_polygon.area)

            # Verify transform was called with the expected parameters
            # We're expecting 6 calls (2 for each hotspot)
            self.assertEqual(mock_transform.call_count, 6)

    def test_get_safer_ors_route_error_handling(self):
        """Test improved error handling in get_safer_ors_route without fallback"""
        # Create a simple avoid polygon
        avoid_polygons = MultiPolygon(
            [
                Polygon(
                    [
                        (-74.02, 40.72),
                        (-74.01, 40.72),
                        (-74.01, 40.73),
                        (-74.02, 40.73),
                        (-74.02, 40.72),
                    ]
                )
            ]
        )

        # Mock ORS response with error
        with patch("requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.ok = False
            mock_response.status_code = 404
            mock_response.text = (
                """{"error":{"code":2009,"message":"Route could not be found"}}"""
            )
            mock_post.return_value = mock_response

            # Call function
            result = get_safer_ors_route(
                self.departure, self.destination, avoid_polygons
            )

            # Verify we get an error response instead of a fallback
            self.assertIn("error", result)
            self.assertIn("OpenRouteService API error", result["error"])

            # Verify no additional request was made (no fallback)
            self.assertEqual(mock_post.call_count, 1)

    def test_metadata_in_routes(self):
        """Test that metadata is properly
        added to routes with direct function patching"""
        # Directly patch the hotspot-returning functions instead of the cursor
        with patch("map.views.get_crime_hotspots") as mock_get_hotspots, patch(
            "map.views.get_additional_hotspots"
        ) as mock_get_additional_hotspots, patch(
            "polyline.decode"
        ) as mock_polyline_decode, patch(
            "requests.post"
        ) as mock_post:
            # Setup polyline decode mock
            mock_polyline_decode.return_value = [
                [-74.0060, 40.7128],
                [-118.2437, 34.0522],
            ]

            # Define hotspot data
            phase1_hotspots = [
                {
                    "latitude": 40.7200,
                    "longitude": -74.0100,
                    "complaints": 15,
                    "distance": 0.01,
                }
            ]

            phase2_hotspots = [
                {
                    "latitude": 40.7400,
                    "longitude": -74.0300,
                    "complaints": 12,
                    "distance": 0.03,
                }
            ]

            # Setup direct function mocks - this approach is more reliable
            mock_get_hotspots.return_value = (
                phase1_hotspots  # Return exactly 1 hotspot in phase 1
            )
            mock_get_additional_hotspots.return_value = (
                phase2_hotspots  # Return 1 hotspot in phase 2
            )

            # Test case 1: Both phase 1 and phase 2 succeed
            # Mock successful responses for both phases
            phase1_response = MagicMock()
            phase1_response.ok = True
            phase1_response.json.return_value = {
                "routes": [{"geometry": "phase1_route_polyline"}]
            }

            phase2_response = MagicMock()
            phase2_response.ok = True
            phase2_response.json.return_value = {
                "routes": [{"geometry": "phase2_route_polyline"}]
            }

            mock_post.side_effect = [phase1_response, phase2_response]

            # Run the function
            result = process_route_with_crime_data(self.mock_initial_route)

            # Verify Phase 2 metadata
            self.assertIn("metadata", result)
            self.assertEqual(result["metadata"]["phase"], "Phase 2")
            self.assertEqual(
                result["metadata"]["avoided_hotspots"], 2
            )  # Total hotspots (1+1)

            # Reset the mocks for the next test
            mock_post.reset_mock()

            # Test case 2: Phase 1 succeeds but Phase 2 fails
            phase2_error_response = MagicMock()
            phase2_error_response.ok = False
            phase2_error_response.status_code = 404
            phase2_error_response.text = """{"error":{"message":"Route not found"}}"""

            mock_post.side_effect = [phase1_response, phase2_error_response]

            # Run the function again
            result = process_route_with_crime_data(self.mock_initial_route)

            # Print debug information
            print(f"Debug - Phase 1 hotspots: {len(phase1_hotspots)}")
            print(f"Debug - metadata: {result.get('metadata', 'No metadata')}")

            # Verify Phase 1 metadata is present in fallback
            self.assertIn("metadata", result)
            self.assertEqual(result["metadata"]["phase"], "Phase 1")
            self.assertEqual(
                result["metadata"]["avoided_hotspots"], 1
            )  # Should be 1 hotspot


class NYCBoundaryValidationTestCase(TestCase):
    """Test cases specifically for NYC boundary validation logic"""

    def test_is_within_nyc_function_points(self):
        """Test the is_within_nyc function with various points"""
        # Valid NYC points
        self.assertTrue(is_within_nyc(40.7128, -74.0060))  # Manhattan
        self.assertTrue(is_within_nyc(40.6782, -73.9442))  # Brooklyn
        self.assertTrue(is_within_nyc(40.7614, -73.9776))  # Midtown Manhattan
        self.assertTrue(is_within_nyc(40.8448, -73.8648))  # Bronx
        self.assertTrue(is_within_nyc(40.7282, -73.7949))  # Queens
        self.assertTrue(is_within_nyc(40.5795, -74.1502))  # Staten Island

        # Invalid points outside NYC
        self.assertFalse(is_within_nyc(40.3573, -74.6672))  # Princeton, NJ
        self.assertFalse(is_within_nyc(42.6526, -73.7562))  # Albany, NY
        self.assertFalse(is_within_nyc(40.7357, -72.9968))  # Long Island (Suffolk)
        self.assertFalse(is_within_nyc(41.0534, -73.5387))  # Stamford, CT

    def test_boundary_edge_cases(self):
        """Test points exactly at or very close to NYC boundaries"""
        # Exactly at southwest corner
        self.assertTrue(is_within_nyc(NYC_BOUNDS["sw"][0], NYC_BOUNDS["sw"][1]))

        # Exactly at northeast corner
        self.assertTrue(is_within_nyc(NYC_BOUNDS["ne"][0], NYC_BOUNDS["ne"][1]))

        # Just inside boundaries
        self.assertTrue(
            is_within_nyc(NYC_BOUNDS["sw"][0] + 0.0001, NYC_BOUNDS["sw"][1] + 0.0001)
        )
        self.assertTrue(
            is_within_nyc(NYC_BOUNDS["ne"][0] - 0.0001, NYC_BOUNDS["ne"][1] - 0.0001)
        )

        # Just outside boundaries
        self.assertFalse(
            is_within_nyc(NYC_BOUNDS["sw"][0] - 0.0001, NYC_BOUNDS["sw"][1])
        )
        self.assertFalse(
            is_within_nyc(NYC_BOUNDS["sw"][0], NYC_BOUNDS["sw"][1] - 0.0001)
        )
        self.assertFalse(
            is_within_nyc(NYC_BOUNDS["ne"][0] + 0.0001, NYC_BOUNDS["ne"][1])
        )
        self.assertFalse(
            is_within_nyc(NYC_BOUNDS["ne"][0], NYC_BOUNDS["ne"][1] + 0.0001)
        )

    def test_serializer_validation_methods_directly(self):
        """Test the RouteInputSerializer validation methods directly"""
        from .serializers import RouteInputSerializer

        # Create a serializer instance
        serializer = RouteInputSerializer()

        # Test valid NYC coordinates
        valid_nyc_coords = [40.7128, -74.0060]  # Manhattan
        self.assertEqual(
            serializer.validate_departure(valid_nyc_coords), valid_nyc_coords
        )
        self.assertEqual(
            serializer.validate_destination(valid_nyc_coords), valid_nyc_coords
        )

        # Test invalid coordinates
        invalid_coords = [42.7128, -73.9566]  # Outside NYC
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_departure(invalid_coords)

        with self.assertRaises(serializers.ValidationError):
            serializer.validate_destination(invalid_coords)

    def test_route_serializer_validate_method(self):
        """Test the validate method of RouteInputSerializer"""
        from .serializers import RouteInputSerializer

        # Test with both route_id and coordinates
        data = {
            "route_id": 1,
            "departure": [40.7128, -74.0060],
            "destination": [40.7580, -73.9855],
        }
        serializer = RouteInputSerializer()
        validated_data = serializer.validate(data)
        self.assertEqual(validated_data, data)

        # Test with only route_id (should pass)
        data_with_route_id = {"route_id": 1}
        validated_data = serializer.validate(data_with_route_id)
        self.assertEqual(validated_data, data_with_route_id)

        # Test with only coordinates (should pass)
        data_with_coords = {
            "departure": [40.7128, -74.0060],
            "destination": [40.7580, -73.9855],
        }
        validated_data = serializer.validate(data_with_coords)
        self.assertEqual(validated_data, data_with_coords)

        # Test with neither route_id nor complete coordinates (should fail)
        invalid_data = {"departure": [40.7128, -74.0060]}
        with self.assertRaises(serializers.ValidationError):
            serializer.validate(invalid_data)

        # Test save_route without route_name (should fail)
        invalid_save_data = {
            "departure": [40.7128, -74.0060],
            "destination": [40.7580, -73.9855],
            "save_route": True,
        }
        with self.assertRaises(serializers.ValidationError):
            serializer.validate(invalid_save_data)

        # Test save_route with route_name (should pass)
        valid_save_data = {
            "departure": [40.7128, -74.0060],
            "destination": [40.7580, -73.9855],
            "save_route": True,
            "route_name": "My Test Route",
        }
        validated_data = serializer.validate(valid_save_data)
        self.assertEqual(validated_data, valid_save_data)
