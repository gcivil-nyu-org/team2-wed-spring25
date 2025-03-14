# map/tests.py
from django.test import TestCase

# Client
from django.urls import reverse

# from django.conf import settings
# import os
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
import requests

# import json
# from django.core.exceptions import ImproperlyConfigured

User = get_user_model()

# from django.db import connection  # Import the connection object


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
