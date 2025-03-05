from django.db import connection
from django.shortcuts import render


def road_view(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM filtered_grouped_data_centroid;")
        rows = cursor.fetchall()
    return render(request, "my_template.html", {"data": rows})
