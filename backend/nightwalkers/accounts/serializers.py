from .models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    total_saved_routes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "avatar",
            "date_joined",
            "avatar_url",
            "total_saved_routes",
            "provider"
        )
        read_only_fields = ("id", "email_verified", "date_joined")

    def get_avatar(self, obj):
        return obj.get_avatar

    def get_total_saved_routes(self, obj):
        return obj.saved_routes.count()
