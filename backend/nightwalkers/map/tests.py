# map/tests.py
from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings
import os
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
import requests

User = get_user_model()

import json
import geopandas as gpd

class RoadViewTest(TestCase):
    def setUp(self):
        # Ensure the GeoJSON file exists
        self.geojson_file_path = os.path.join(
            settings.BASE_DIR, "map", "data", "filtered_grouped_data_centroid.geojson"
        )

        if not os.path.exists(self.geojson_file_path):
            raise FileNotFoundError(
                f"The GeoJSON file does not exist at {self.geojson_file_path}"
            )

        # Define the bounds for latitude and longitude
        self.min_longitude = -74.30
        self.max_longitude = -73.70
        self.min_latitude = 40.40
        self.max_latitude = 41.00

    def test_road_view(self):
        # Use the Django test client to make a GET request to the view
        response = self.client.get(
            reverse("road-data")
        )  # Update with your actual URL name if different

        # Assert that the response was successful (HTTP status code 200)
        self.assertEqual(response.status_code, 200)

        # Check that the correct context is passed to the template
        self.assertIn("data", response.context)

        # Iterate over the data in the response to test for missing values
        for point in response.context["data"]:
            # Check that each value is not empty or None
            self.assertIsNotNone(
                point["latitude"],
                f"Latitude missing for {point['road_seg_i']}",
            )
            self.assertIsNotNone(
                point["longitude"],
                f"Longitude missing for {point['road_seg_i']}",
            )
            self.assertIsNotNone(
                point["total_popu"],
                f"Total population missing for {point['road_seg_i']}",
            )
            self.assertIsNotNone(
                point["CMPLNT_NUM"],
                f"Complaint number missing for {point['road_seg_i']}",
            )
            self.assertIsNotNone(
                point["ratio"],
                f"Complaint to pop ratio missing for {point['road_seg_i']}",
            )

            # Ensure no value empty
            self.assertNotEqual(
                point["latitude"],
                "",
                f"Latitude empty for {point['road_seg_i']}",
            )
            self.assertNotEqual(
                point["longitude"],
                "",
                f"Longitude empty for {point['road_seg_i']}",
            )
            self.assertNotEqual(
                point["total_popu"],
                "",
                f"Total population empty for {point['road_seg_i']}",
            )
            self.assertNotEqual(
                point["CMPLNT_NUM"],
                "",
                f"Complaint number empty for {point['road_seg_i']}",
            )
            self.assertNotEqual(
                point["ratio"],
                "",
                f"Complaint to population ratio empty for {point['road_seg_i']}",
            )

            # Verify that the latitude and longitude are within the defined bounds
            self.assertGreaterEqual(point["latitude"], self.min_latitude)
            self.assertLessEqual(point["latitude"], self.max_latitude)
            self.assertGreaterEqual(point["longitude"], self.min_longitude)
            self.assertLessEqual(point["longitude"], self.max_longitude)


class RouteViewAPITests(TestCase):
    """
    Test cases for the RouteViewAPI endpoint
    """

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()

        # Create a test user
        self.test_user = User.objects.create_user(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            password="testpassword123",
        )

        # Create a test saved route
        # self.saved_route = SavedRoute.objects.create(
        #     user=self.test_user,
        #     name="Test Route",
        #     departure_lat=40.7128,
        #     departure_lon=-74.0060,
        #     destination_lat=34.0522,
        #     destination_lon=-118.2437
        # )

        # URL for API endpoint
        self.url = reverse("get-route")

        # Sample valid data for requests
        self.valid_data = {
            "departure": [40.7128, -74.0060],
            "destination": [34.0522, -118.2437],
            "saved_route": False,
        }

        # Set up successful mock response from OpenRouteService
        self.mock_ors_response = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "segments": [{"distance": 3941.2, "duration": 3146.6}],
                        "summary": {"distance": 3941.2, "duration": 3146.6},
                    },
                    "geometry": {
                        "coordinates": [[-74.0060, 40.7128], [-118.2437, 34.0522]],
                        "type": "LineString",
                    },
                }
            ],
        }

    @patch("requests.post")
    def test_unauthenticated_access_denied(self, mock_post):
        """Test that unauthenticated users cannot access the endpoint"""
        response = self.client.post(self.url, self.valid_data, format="json")
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
        self.client.force_authenticate(user=self.test_user)

        response = self.client.post(self.url, self.valid_data, format="json")
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
        self.client.force_authenticate(user=self.test_user)

        response = self.client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["initial_route"], self.mock_ors_response)
        self.assertIsNone(response.data["safer_route"])

    @patch("requests.post")
    def test_save_route_unauthenticated(self, mock_post):
        """Test attempting to save a route while unauthenticated"""
        # Data for saving a new route
        data = {
            "departure": [40.7128, -74.0060],
            "destination": [34.0522, -118.2437],
            "saved_route": True,
            "name": "New Saved Route",
        }

        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("requests.post")
    def test_openrouteservice_error(self, mock_post):
        """Test handling of errors from OpenRouteService"""
        # Setup mock for OpenRouteService error
        mock_post.side_effect = requests.exceptions.RequestException("API Error")

        # Authenticate user
        self.client.force_authenticate(user=self.test_user)

        response = self.client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

class HeatmapDataViewTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_heatmap_data_view_real_data_not_empty(self):
        # Test the view with a real GeoJSON file and check for non-empty data
        real_geojson_path = os.path.join(settings.BASE_DIR, "map", "data", "filtered_grouped_data_centroid.geojson") #Adjust the path if needed.

        if not os.path.exists(real_geojson_path):
            raise ImproperlyConfigured(f"Real GeoJSON file not found at: {real_geojson_path}")

        with self.settings(BASE_DIR=settings.BASE_DIR):
            response = self.client.get(
                reverse("heatmap-data")
            )  
            # response = self.client.get('/map/heatmap-data/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['content-type'], 'application/json')

            data = json.loads(response.content)
            self.assertIsInstance(data, list)
            self.assertTrue(len(data) > 0, "Real data should not be empty")

            for item in data:
                self.assertIsInstance(item, dict)
                self.assertIn('latitude', item)
                self.assertIn('longitude', item)
                self.assertIn('intensity', item)
                self.assertIsInstance(item['latitude'], (int, float), "Latitude should be a number")
                self.assertIsInstance(item['longitude'], (int, float), "Longitude should be a number")
                self.assertIsInstance(item['intensity'], (int, float), "Intensity should be a number")
                self.assertIsNotNone(item['latitude'], "Latitude should not be None")
                self.assertIsNotNone(item['longitude'], "Longitude should not be None")
                self.assertIsNotNone(item['intensity'], "Intensity should not be None")
                self.assertTrue(-90 <= item['latitude'] <= 90, "Latitude should be within valid range")
                self.assertTrue(-180 <= item['longitude'] <= 180, "Longitude should be within valid range")
                self.assertTrue(0 <= item['intensity'], "Intensity should be within valid range")
