from django.contrib.gis.db import models
from accounts.models import User


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


class IssueOnLocationReport(models.Model):
    report_status = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    user = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="location_issue"
    )
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=700)
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    location_str = models.CharField(max_length=200)
    status = models.CharField(max_length=15, choices=report_status, default="pending")
    rejection_reason = models.TextField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.title}"
