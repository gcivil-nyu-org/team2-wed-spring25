# I THINK THIS WOULD ONLY BE NEEDED IF WE WANTED TO UPDATE THIS DYNAMICALLY
from django.contrib.gis.db import models
from accounts.models import User

# class Location(models.Model):
#     name = models.CharField(max_length=255)
#     road_geometry = models.GeometryField(srid=3857) #Make sure the SRID is correct.

#     def __str__(self):
#         return self.name


class SavedRoute(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="saved_routes"
    )
    name = models.CharField(max_length=50)
    departure_lat = models.FloatField()
    departure_lon = models.FloatField()
    destination_lat = models.FloatField()
    destination_lon = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    favorite = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} by {self.user.first_name}"
