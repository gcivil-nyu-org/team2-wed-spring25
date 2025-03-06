import geopandas as gpd
from django.shortcuts import render
import os
from django.conf import settings

def road_view(request):
    # Define the path to the GeoJSON file you want to query
    geojson_file_path = os.path.join(settings.BASE_DIR, 'map', 'data', 'my_points.geojson')
    
    # Load the GeoJSON file as a GeoDataFrame using GeoPandas
    points_gdf = gpd.read_file(geojson_file_path)
    
    # Convert the GeoDataFrame to a list of dictionaries (similar to what you would get from the database)
    rows = points_gdf.to_dict(orient='records')

    # Pass the data to the template
    return render(request, "my_template.html", {"data": rows})