# map/tests.py
from django.test import TestCase
from django.urls import reverse
from django.conf import settings
import os


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
            reverse("road_data")
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
