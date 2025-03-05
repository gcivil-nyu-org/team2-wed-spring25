from django.shortcuts import render
from .models import Location
from django.core.serializers import serialize
from django.http import HttpResponse

def map_view(request):
    locations = Location.objects.all()
    geojson_data = serialize('geojson', locations, geometry_field='road_geometry', fields=('name',)) # Serialize to GeoJSON
    return render(request, 'maps/map.html', {'geojson_data': geojson_data})

def location_json(request):
    locations = Location.objects.all()
    geojson_data = serialize('geojson', locations, geometry_field='road_geometry', fields=('name',)) # Serialize to GeoJSON
    return HttpResponse(geojson_data, content_type='application/json')
