import geopandas as gpd
from django.shortcuts import render
import os
from django.conf import settings
from django.http import JsonResponse


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
