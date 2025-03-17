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

    def validate(self, data):
        route_id = data.get("route_id")
        departure = data.get("departure")
        destination = data.get("destination")
        if route_id is None and (not departure or not destination):
            raise serializers.ValidationError(
                "Departure and destination coordinates are required or saved route"
            )
        if data.get("saved_route") and not data.get("route_name"):
            raise serializers.ValidationError("No route name was passed")
        return data


class SavedRouteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRoute
        fields = ["id", "favorite"]


class RouteResponseSerializer(serializers.ModelSerializer):
    route = serializers.JSONField()
    route_id = serializers.IntegerField(allow_null=True, required=False)
