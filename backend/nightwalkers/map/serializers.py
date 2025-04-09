from rest_framework import serializers
from .models import SavedRoute


class SavedRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRoute
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at"]

    def validate_name(self, value):
        user = self.context["user"]
        if SavedRoute.objects.filter(user=user, name=value).exists():
            raise serializers.ValidationError("Route with name already exists")
        return value

    def create(self, validated_data):
        user = self.context["user"]
        return SavedRoute.objects.create(user=user, **validated_data)


NYC_BOUNDS = {
    "sw": [40.4957, -74.2557],  # Southwest corner
    "ne": [40.9176, -73.7002],  # Northeast corner
}


def is_within_nyc(lat, lng):
    """Check if coordinates are within NYC boundaries"""
    return (
        lat >= NYC_BOUNDS["sw"][0]
        and lat <= NYC_BOUNDS["ne"][0]
        and lng >= NYC_BOUNDS["sw"][1]
        and lng <= NYC_BOUNDS["ne"][1]
    )


class RouteInputSerializer(serializers.Serializer):
    route_id = serializers.IntegerField(required=False, allow_null=True)
    departure = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=False,
    )
    destination = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=False,
    )
    save_route = serializers.BooleanField(required=False, default=False)
    route_name = serializers.CharField(required=False, max_length=50)

    def validate_departure(self, value):
        """Validate that departure coordinates are within NYC bounds"""
        if value is not None:
            lat, lng = value
            if not is_within_nyc(lat, lng):
                raise serializers.ValidationError(
                    "Departure coordinates must be within New York City boundaries."
                )
        return value

    def validate_destination(self, value):
        """Validate that destination coordinates are within NYC bounds"""
        if value is not None:
            lat, lng = value
            if not is_within_nyc(lat, lng):
                raise serializers.ValidationError(
                    "Destination coordinates must be within New York City boundaries."
                )
        return value

    def validate(self, data):
        # Keep your original validation logic
        route_id = data.get("route_id")
        departure = data.get("departure")
        destination = data.get("destination")

        if route_id is None and (not departure or not destination):
            raise serializers.ValidationError(
                "Departure and destination coordinates are required or saved route"
            )

        if data.get("save_route") and not data.get("route_name"):
            raise serializers.ValidationError("No route name was passed")

        return data


class SavedRouteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRoute
        fields = ["id", "favorite"]


class RouteResponseSerializer(serializers.ModelSerializer):
    route = serializers.JSONField()
    route_id = serializers.IntegerField(allow_null=True, required=False)
