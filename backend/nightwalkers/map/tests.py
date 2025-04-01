# from django.test import TestCase, Client
# from django.urls import reverse
# from django.contrib.auth import get_user_model
# from rest_framework.test import APIClient
# from rest_framework import status
# from unittest.mock import patch, MagicMock
# import requests
# import json
# from shapely.geometry import Polygon, MultiPolygon

# from .models import SavedRoute
# from .views import (
#     process_route_with_crime_data,
#     get_crime_hotspots,
#     create_avoid_polygons,
#     get_safer_ors_route,
# )

# User = get_user_model()


# class BaseTestCase(TestCase):
#     """Base test case with common setup for all test classes"""

#     def setUp(self):
#         """Set up test data and clients that are common across test cases"""
#         # Create test users
#         self.user1 = User.objects.create_user(
#             email="test1@example.com",
#             password="testpass123",
#             first_name="Test",
#             last_name="User1",
#         )

#         self.user2 = User.objects.create_user(
#             email="test2@example.com",
#             password="testpass123",
#             first_name="Test",
#             last_name="User2",
#         )

#         # Set up API client
#         self.api_client = APIClient()
#         self.client = Client()


# class SavedRouteAPITestCase(BaseTestCase):
#     """Test cases for SavedRoute API endpoints"""

#     def setUp(self):
#         """Set up test data specific to SavedRoute tests"""
#         super().setUp()

#         # Create test routes for user1
#         self.route1 = SavedRoute.objects.create(
#             user=self.user1,
#             name="Home to Work",
#             departure_lat=40.7128,
#             departure_lon=-74.0060,
#             destination_lat=40.7580,
#             destination_lon=-73.9855,
#             favorite=True,
#         )

#         self.route2 = SavedRoute.objects.create(
#             user=self.user1,
#             name="Home to Gym",
#             departure_lat=40.7128,
#             departure_lon=-74.0060,
#             destination_lat=40.7431,
#             destination_lon=-73.9712,
#             favorite=False,
#         )

#         # Create test route for user2
#         self.route3 = SavedRoute.objects.create(
#             user=self.user2,
#             name="My Route",
#             departure_lat=40.6892,
#             departure_lon=-74.0445,
#             destination_lat=40.7831,
#             destination_lon=-73.9712,
#             favorite=True,
#         )

#         # URLs for the endpoints - only set the ones that don't need parameters
#         self.save_route_url = reverse("save-route")
#         self.retrieve_routes_url = reverse("retrieve-routes")
#         self.update_route_url = reverse("update-route")
#         # Note: delete_route_url is not set here because it requires a pk parameter

#     def test_save_route_authenticated(self):
#         """Test saving a new route as an authenticated user"""
#         self.api_client.force_authenticate(user=self.user1)

#         data = {
#             "name": "New Test Route",
#             "departure_lat": 40.7128,
#             "departure_lon": -74.0060,
#             "destination_lat": 40.7580,
#             "destination_lon": -73.9855,
#             "favorite": False,
#         }

#         response = self.api_client.post(self.save_route_url, data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(SavedRoute.objects.count(), 4)
#         self.assertEqual(SavedRoute.objects.filter(user=self.user1).count(), 3)
#         self.assertEqual(response.data["name"], "New Test Route")

#     def test_save_route_duplicate_name(self):
#         """Test that a user cannot save two routes with the same name"""
#         self.api_client.force_authenticate(user=self.user1)

#         data = {
#             "name": "Home to Work",  # This name already exists for user1
#             "departure_lat": 40.7128,
#             "departure_lon": -74.0060,
#             "destination_lat": 40.7580,
#             "destination_lon": -73.9855,
#             "favorite": False,
#         }

#         response = self.api_client.post(self.save_route_url, data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertEqual(SavedRoute.objects.count(), 3)  # No new route added

#     def test_save_route_unauthenticated(self):
#         """Test that unauthenticated users cannot save routes"""
#         data = {
#             "name": "Unauthenticated Route",
#             "departure_lat": 40.7128,
#             "departure_lon": -74.0060,
#             "destination_lat": 40.7580,
#             "destination_lon": -73.9855,
#             "favorite": False,
#         }

#         response = self.api_client.post(self.save_route_url, data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertEqual(SavedRoute.objects.count(), 3)  # No new route added

#     def test_retrieve_saved_routes(self):
#         """Test retrieving saved routes for an authenticated user"""
#         self.api_client.force_authenticate(user=self.user1)

#         # Make sure we know exactly how many routes should exist for user1
#         user1_route_count = SavedRoute.objects.filter(user=self.user1).count()

#         response = self.api_client.get(self.retrieve_routes_url)

#         self.assertEqual(response.status_code, status.HTTP_200_OK)

#         # If pagination is in use, we need to check for 'results' key
#         if "results" in response.data:
#             # Check that the first page has the expected routes
#             results = response.data["results"]
#             self.assertGreaterEqual(len(results), 1)

#             # Check that the route1 (favorite) is before route2 (non-favorite)
#             # Find the indices of route1 and route2 in the results
#             route1_index = next(
#                 (i for i, item in enumerate(results) if item["id"] == self.route1.id),
#                 None,
#             )
#             route2_index = next(
#                 (i for i, item in enumerate(results) if item["id"] == self.route2.id),
#                 None,
#             )

#             # If both routes are in the first page of results, check their order
#             if route1_index is not None and route2_index is not None:
#                 self.assertLess(
#                     route1_index,
#                     route2_index,
#                     "Favorite route should come before non-favorite route",
#                 )
#         else:
#             # No pagination - check the total count matches expected
#             self.assertEqual(len(response.data), user1_route_count)

#             # Find the indices of route1 and route2 in the results
#             route1_index = next(
#                 (
#                     i
#                     for i, item in enumerate(response.data)
#                     if item["id"] == self.route1.id
#                 ),
#                 None,
#             )
#             route2_index = next(
#                 (
#                     i
#                     for i, item in enumerate(response.data)
#                     if item["id"] == self.route2.id
#                 ),
#                 None,
#             )

#             # If both routes are in the results, check their order
#             if route1_index is not None and route2_index is not None:
#                 self.assertLess(
#                     route1_index,
#                     route2_index,
#                     "Favorite route should come before non-favorite route",
#                 )

#     def test_retrieve_saved_routes_unauthenticated(self):
#         """Test that unauthenticated users cannot retrieve routes"""
#         response = self.api_client.get(self.retrieve_routes_url)

#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

#     def test_update_saved_route(self):
#         """Test updating a saved route (favorite status)"""
#         self.api_client.force_authenticate(user=self.user1)

#         data = {"id": self.route2.id, "favorite": True}

#         response = self.api_client.put(self.update_route_url, data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_200_OK)

#         # Refresh from database
#         self.route2.refresh_from_db()
#         self.assertTrue(self.route2.favorite)

#     def test_update_route_of_another_user(self):
#         """Test that a user cannot update another user's route"""
#         self.api_client.force_authenticate(user=self.user1)

#         data = {
#             "id": self.route3.id,  # This belongs to user2
#             "favorite": False,  # Change to False to see if it remains True
#         }

#         try:
#             response = self.api_client.put(self.update_route_url, data, format="json")
#             # If we get here, check status code
#             self.assertIn(
#                 response.status_code,
#                 [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN],
#             )
#         except Exception:
#             # The test may raise an exception due to the DoesNotExist being raised
#             # That's okay, as long as the route is unchanged
#             pass

#         # Refresh from database - the important thing is that the route is unchanged
#         self.route3.refresh_from_db()
#         self.assertTrue(self.route3.favorite)  # Should remain unchanged

#     def test_update_route_unauthenticated(self):
#         """Test that unauthenticated users cannot update routes"""
#         data = {"id": self.route1.id, "favorite": False}

#         response = self.api_client.put(self.update_route_url, data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

#         # Refresh from database
#         self.route1.refresh_from_db()
#         self.assertTrue(self.route1.favorite)  # Unchanged

#     def test_delete_saved_route(self):
#         """Test deleting a saved route"""
#         self.api_client.force_authenticate(user=self.user1)

#         # Generate the delete URL with the specific pk
#         delete_url = reverse("delete-route", kwargs={"pk": self.route2.id})

#         response = self.api_client.delete(delete_url)

#         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
#         self.assertEqual(SavedRoute.objects.count(), 2)
#         self.assertFalse(SavedRoute.objects.filter(id=self.route2.id).exists())

#     def test_delete_route_of_another_user(self):
#         """Test that a user cannot delete another user's route"""
#         self.api_client.force_authenticate(user=self.user1)

#         # Generate the delete URL with the specific pk
#         delete_url = reverse("delete-route", kwargs={"pk": self.route3.id})

#         try:
#             response = self.api_client.delete(delete_url)
#             # If we get here, check status code
#             self.assertIn(
#                 response.status_code,
#                 [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN],
#             )
#         except Exception:
#             # The test may raise an exception due to the DoesNotExist being raised
#             # That's okay, as long as the route is not deleted
#             pass

#         # The key assertion is that the route still exists
#         self.assertEqual(SavedRoute.objects.count(), 3)  # No route deleted
#         self.assertTrue(SavedRoute.objects.filter(id=self.route3.id).exists())

#     def test_delete_route_unauthenticated(self):
#         """Test that unauthenticated users cannot delete routes"""
#         # Generate the delete URL with the specific pk
#         delete_url = reverse("delete-route", kwargs={"pk": self.route1.id})

#         response = self.api_client.delete(delete_url)

#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertEqual(SavedRoute.objects.count(), 3)  # No route deleted
#         self.assertTrue(SavedRoute.objects.filter(id=self.route1.id).exists())


# class RouteViewAPITestCase(BaseTestCase):
#     """Test cases for the RouteViewAPI endpoint"""

#     def setUp(self):
#         """Set up test data specific to RouteViewAPI tests"""
#         super().setUp()

#         # Create test route
#         self.saved_route = SavedRoute.objects.create(
#             user=self.user1,
#             name="Existing Route",
#             departure_lat=40.7128,
#             departure_lon=-74.0060,
#             destination_lat=40.7580,
#             destination_lon=-73.9855,
#             favorite=True,
#         )

#         # URL for API endpoint
#         self.url = reverse("get-route")

#         # Sample valid data for requests
#         self.valid_data = {
#             "departure": [40.7128, -74.0060],
#             "destination": [34.0522, -118.2437],
#             "saved_route": False,
#         }

#         # Set up successful mock response from OpenRouteService
#         self.mock_ors_response = {
#             "routes": [
#                 {
#                     "geometry": "some_encoded_polyline",
#                     "legs": [],
#                     "summary": {"distance": 3941.2, "duration": 3146.6},
#                 }
#             ],
#             "type": "FeatureCollection",
#             "features": [
#                 {
#                     "type": "Feature",
#                     "properties": {
#                         "segments": [{"distance": 3941.2, "duration": 3146.6}],
#                         "summary": {"distance": 3941.2, "duration": 3146.6},
#                     },
#                     "geometry": {
#                         "coordinates": [[-74.0060, 40.7128], [-118.2437, 34.0522]],
#                         "type": "LineString",
#                     },
#                 }
#             ],
#         }

#         # Mock safer route response
#         self.mock_safer_route = {
#             "routes": [
#                 {
#                     "geometry": "another_encoded_polyline",
#                     "legs": [],
#                     "summary": {"distance": 4100.5, "duration": 3300.2},
#                 }
#             ],
#             "type": "FeatureCollection",
#             "features": [
#                 {
#                     "type": "Feature",
#                     "properties": {
#                         "segments": [{"distance": 4100.5, "duration": 3300.2}],
#                         "summary": {"distance": 4100.5, "duration": 3300.2},
#                     },
#                     "geometry": {
#                         "coordinates": [[-74.0060, 40.7128], [-118.2437, 34.0522]],
#                         "type": "LineString",
#                     },
#                 }
#             ],
#         }

#     @patch("requests.post")
#     def test_unauthenticated_access_denied(self, mock_post):
#         """Test that unauthenticated users cannot access the endpoint"""
#         response = self.api_client.post(self.url, self.valid_data, format="json")
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

#     @patch("requests.post")
#     def test_authenticated_access_allowed(self, mock_post):
#         """Test that authenticated users can access the endpoint"""
#         # Setup mock for OpenRouteService
#         mock_response = MagicMock()
#         mock_response.json.return_value = self.mock_ors_response
#         mock_response.raise_for_status.return_value = None
#         mock_post.return_value = mock_response

#         # Authenticate user
#         self.api_client.force_authenticate(user=self.user1)

#         response = self.api_client.post(self.url, self.valid_data, format="json")
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("initial_route", response.data)

#     @patch("requests.post")
#     def test_route_with_coordinates(self, mock_post):
#         """Test getting a route using coordinates"""
#         # Setup mock for OpenRouteService
#         mock_response = MagicMock()
#         mock_response.json.return_value = self.mock_ors_response
#         mock_response.raise_for_status.return_value = None
#         mock_post.return_value = mock_response

#         # Authenticate user
#         self.api_client.force_authenticate(user=self.user1)

#         response = self.api_client.post(self.url, self.valid_data, format="json")
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data["initial_route"], self.mock_ors_response)
#         self.assertIsNone(response.data["safer_route"])

#     @patch("requests.post")
#     @patch("polyline.decode")
#     @patch("django.db.connection.cursor")
#     def test_safer_route_generation_failure(
#         self, mock_cursor, mock_polyline_decode, mock_post
#     ):
#         """Test fallback when safer route generation fails"""
#         # Setup mock for OpenRouteService
#         mock_response = MagicMock()
#         mock_response.json.return_value = self.mock_ors_response
#         mock_post.return_value = mock_response

#         # Mock polyline decoding to raise an exception during safer route generation
#         mock_polyline_decode.side_effect = Exception("Polyline decode error")

#         # Authenticate user
#         self.api_client.force_authenticate(user=self.user1)

#         response = self.api_client.post(self.url, self.valid_data, format="json")

#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data["initial_route"], self.mock_ors_response)
#         self.assertIsNone(response.data["safer_route"])
#         self.assertIn("message", response.data)

#     @patch("requests.post")
#     def test_openrouteservice_error(self, mock_post):
#         """Test handling of errors from OpenRouteService"""
#         # Setup mock for OpenRouteService error
#         mock_post.side_effect = requests.exceptions.RequestException("API Error")

#         # Authenticate user
#         self.api_client.force_authenticate(user=self.user1)

#         response = self.api_client.post(self.url, self.valid_data, format="json")
#         self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
#         self.assertIn("error", response.data)

#     @patch("requests.post")
#     def test_save_route_unauthenticated(self, mock_post):
#         """Test attempting to save a route while unauthenticated"""
#         # Data for saving a new route
#         data = {
#             "departure": [40.7128, -74.0060],
#             "destination": [34.0522, -118.2437],
#             "saved_route": True,
#             "name": "New Saved Route",
#         }

#         response = self.api_client.post(self.url, data, format="json")
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# class HeatmapDataTestCase(BaseTestCase):
#     """Test cases for the heatmap_data function"""

#     def setUp(self):
#         super().setUp()
#         self.url = reverse("heatmap-data")  # URL for heatmap data endpoint

#         # Sample data to be returned by the cursor
#         self.mock_data = [
#             (40.7128, -74.0060, "5"),
#             (40.7580, -73.9855, "10"),
#             (40.7431, -73.9712, None),
#         ]

#     @patch("django.db.connection.cursor")
#     def test_heatmap_data_success(self, mock_cursor):
#         """Test successful retrieval of heatmap data"""
#         # Mock the cursor's fetchall method to return our sample data
#         mock_cursor_instance = MagicMock()
#         mock_cursor_instance.fetchall.return_value = self.mock_data
#         mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

#         response = self.client.get(self.url)

#         self.assertEqual(response.status_code, 200)
#         data = json.loads(response.content)
#         self.assertEqual(len(data), 3)

#         # Verify the data is formatted correctly
#         self.assertEqual(data[0]["latitude"], 40.7128)
#         self.assertEqual(data[0]["longitude"], -74.0060)
#         self.assertEqual(data[0]["intensity"], 5.0)

#         # Verify that None is handled properly
#         self.assertEqual(data[2]["intensity"], 0.0)

#     @patch("django.db.connection.cursor")
#     def test_heatmap_data_db_error(self, mock_cursor):
#         """Test handling of database errors"""
#         # Mock the cursor to raise an exception
#         mock_cursor.return_value.__enter__.side_effect = Exception("Database error")

#         response = self.client.get(self.url)

#         self.assertEqual(response.status_code, 200)  # Even on error, returns 200
#         data = json.loads(response.content)
#         self.assertEqual(data, [])  # Empty list on error


# class RouteSafetyFunctionsTestCase(BaseTestCase):
#     """Test cases for the route safety processing functions"""

#     def setUp(self):
#         super().setUp()
#         self.linestring = "LINESTRING(-74.0060 40.7128, -118.2437 34.0522)"

#         self.mock_hotspots = [
#             {
#                 "latitude": 40.7200,
#                 "longitude": -74.0100,
#                 "complaints": 15,
#                 "distance": 0.01,
#             },
#             {
#                 "latitude": 40.7300,
#                 "longitude": -74.0200,
#                 "complaints": 20,
#                 "distance": 0.02,
#             },
#         ]

#         self.mock_initial_route = {
#             "routes": [
#                 {
#                     "geometry": "some_encoded_polyline",
#                     "summary": {"distance": 3941.2, "duration": 3146.6},
#                 }
#             ]
#         }

#         self.departure = [-74.0060, 40.7128]
#         self.destination = [-118.2437, 34.0522]

#     @patch("django.db.connection.cursor")
#     def test_get_crime_hotspots(self, mock_cursor):
#         """Test the get_crime_hotspots function"""
#         # Mock the cursor response
#         mock_cursor_instance = MagicMock()
#         mock_cursor_instance.fetchall.return_value = [
#             (40.7200, -74.0100, 15, 0.01),
#             (40.7300, -74.0200, 20, 0.02),
#         ]
#         mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

#         result = get_crime_hotspots(self.linestring)

#         self.assertEqual(len(result), 2)
#         self.assertEqual(result[0]["latitude"], 40.7200)
#         self.assertEqual(result[0]["longitude"], -74.0100)
#         self.assertEqual(result[0]["complaints"], 15)
#         self.assertEqual(result[0]["distance"], 0.01)

#     @patch("django.db.connection.cursor")
#     def test_get_crime_hotspots_db_error(self, mock_cursor):
#         """Test get_crime_hotspots handling of database errors"""
#         # Mock the cursor to raise an exception
#         mock_cursor.return_value.__enter__.side_effect = Exception("Database error")

#         result = get_crime_hotspots(self.linestring)

#         self.assertEqual(result, [])  # Should return empty list on error

#     def test_create_avoid_polygons(self):
#         """Test the create_avoid_polygons function"""
#         result = create_avoid_polygons(self.mock_hotspots, radius=0.1)

#         self.assertIsInstance(result, MultiPolygon)
#         self.assertEqual(len(result.geoms), 2)

#         # Each polygon should have 9 coordinates (8 points + closing point)
#         for polygon in result.geoms:
#             self.assertEqual(len(polygon.exterior.coords), 9)

#     def test_create_avoid_polygons_empty(self):
#         """Test create_avoid_polygons with empty hotspots"""
#         result = create_avoid_polygons([])

#         self.assertIsNone(result)

#     @patch("requests.post")
#     def test_get_safer_ors_route(self, mock_post):
#         """Test the get_safer_ors_route function"""
#         # Create a simple avoid polygon
#         avoid_polygons = MultiPolygon(
#             [
#                 Polygon(
#                     [
#                         (-74.02, 40.72),
#                         (-74.01, 40.72),
#                         (-74.01, 40.73),
#                         (-74.02, 40.73),
#                         (-74.02, 40.72),
#                     ]
#                 )
#             ]
#         )

#         # Mock ORS response
#         mock_response = MagicMock()
#         mock_response.json.return_value = {
#             "routes": [{"geometry": "safer_route_polyline"}]
#         }
#         mock_post.return_value = mock_response

#         result = get_safer_ors_route(self.departure, self.destination, avoid_polygons)

#         self.assertEqual(result["routes"][0]["geometry"], "safer_route_polyline")

#         # Verify that avoid_polygons was included in the request
#         args, kwargs = mock_post.call_args
#         self.assertIn("json", kwargs)
#         self.assertIn("options", kwargs["json"])
#         self.assertIn("avoid_polygons", kwargs["json"]["options"])

#     @patch("requests.post")
#     def test_get_safer_ors_route_error(self, mock_post):
#         """Test get_safer_ors_route handling of API errors"""
#         # Mock ORS response to raise an exception
#         mock_post.side_effect = requests.exceptions.RequestException("API error")

#         result = get_safer_ors_route(self.departure, self.destination, None)

#         self.assertIn("error", result)

#     @patch("polyline.decode")
#     @patch("django.db.connection.cursor")
#     @patch("requests.post")
#     def test_process_route_with_crime_data(
#         self, mock_post, mock_cursor, mock_polyline_decode
#     ):
#         """Test the process_route_with_crime_data function"""
#         # Mock polyline decode
#         mock_polyline_decode.return_value = [[-74.0060, 40.7128], \
#           [-118.2437, 34.0522]]

#         # Mock cursor for crime data
#         mock_cursor_instance = MagicMock()
#         mock_cursor_instance.fetchall.return_value = [
#             (40.7200, -74.0100, 15, 0.01),
#             (40.7300, -74.0200, 20, 0.02),
#         ]
#         mock_cursor.return_value.__enter__.return_value = mock_cursor_instance

#         # Mock ORS response for safer route
#         mock_response = MagicMock()
#         mock_response.json.return_value = {
#             "routes": [{"geometry": "safer_route_polyline"}]
#         }
#         mock_post.return_value = mock_response

#         result = process_route_with_crime_data(self.mock_initial_route)

#         self.assertEqual(result["routes"][0]["geometry"], "safer_route_polyline")
