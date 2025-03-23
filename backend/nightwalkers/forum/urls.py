from django.urls import path
from . import views

urlpatterns = [
    # Post endpoints
    path("user_data/", views.get_user_data, name="get_user_data"),
    path("posts/", views.get_posts, name="get_posts"),
    path("posts/create/", views.create_post, name="create_post"),
    path("posts/repost/", views.create_repost, name="create_repost"),
    path("posts/<int:post_id>/", views.get_post, name="get_post"),
    path("posts/<int:post_id>/delete/", views.delete_post, name="get_post"),
    # Comment endpoints
    path(
        "posts/<int:post_id>/comments/",
        views.comments,
        name="comments",
    ),
    # Like endpoints
    path("posts/<int:post_id>/like/", views.like_post, name="like_post"),
    path("posts/<int:post_id>/unlike/", views.unlike_post, name="unlike_post"),
    path(
        "posts/comments/<int:comment_id>/like/", views.like_comment, name="like_comment"
    ),
    path(
        "posts/follow/<int:user_id>/",
        views.follow_unfollow_user,
        name="follow_unfollow_user",
    ),
    path("posts/<int:post_id>/report/", views.report_post, name="report_post"),
    path("posts/comment/report/", views.report_comment, name="report_post"),
    path(
        "posts/<int:post_id>/comments/<int:comment_id>/delete/",
        views.delete_comment,
        name="report_post",
    ),
]
