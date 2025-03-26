from rest_framework import serializers
from .models import Post, Comment, Like


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            "id",
            "user",
            "titel",
            "content",
            "image_urls",
            "date_created",
            "date_updated",
        ]


class PostSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ["id", "user", "post", "content", "date_created", "date_updated"]


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "user", "post", "content", "date_created"]
