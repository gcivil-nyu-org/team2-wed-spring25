from .models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'email_verified',
            'provider',
            'avatar',
            'date_joined'
        )
        read_only_fields = ('id', 'email_verified', 'date_joined')

    def get_avatar(self, obj):
        return obj.get_avatar