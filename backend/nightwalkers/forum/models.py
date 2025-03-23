from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import (
    ArrayField,
)  # For storing image URLs as an array


class Post(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )
    title = models.CharField(max_length=255, blank=False, null=False)
    content = models.TextField(blank=False, null=False)
    image_urls = ArrayField(
        models.URLField(max_length=1024, blank=True),
        blank=True,
        default=list,
        help_text="Array of image URLs associated with the post",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    # Repost fields
    is_repost = models.BooleanField(default=False)  # Indicates if this is a repost
    original_post = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reposts",
        help_text="The original post that this post is reposting",
    )
    reposted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reposted_posts",
        help_text="The user who reposted this post",
    )

    def __str__(self):
        if self.is_repost:
            return f"Repost by {self.reposted_by.get_full_name()} \
                (Original: {self.original_post})"
        return f"Post: {self.content} by {self.user.get_full_name()}"

    class Meta:
        ordering = ["-date_created"]  # Orders posts by most recent first


class Comment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    parent_comment = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
    content = models.TextField(blank=False, null=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.post.content}"

    class Meta:
        ordering = ["date_created"]  # Orders comments by oldest first


class ReportComment(models.Model):
    # The comment being reported
    comment = models.ForeignKey(
        "Comment", on_delete=models.CASCADE, related_name="reports"
    )

    # The user who is reporting the comment
    reporting_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reported_comments"
    )

    # Timestamp of the report
    date_reported = models.DateTimeField(auto_now_add=True)
    # Reason for reporting (optional)
    reason = models.TextField(blank=True, null=True)
    def __str__(self):
        return f"Report on Comment {self.comment.id} by {self.reporting_user.get_full_name()}"

    class Meta:
        ordering = ["-date_reported"]  # Orders reports by most recent first
        unique_together = [["comment", "reporting_user"]]  # Prevents duplicate reports by the same user on the same comment


class Like(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes"
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    like_type = models.CharField(max_length=10, null=True, default="Like")
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Like by {self.user.get_full_name()} on {self.post.title}"

    class Meta:
        unique_together = ("user", "post")  # Ensures a user can like a post only once


class CommentLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.ForeignKey(
        "Comment", on_delete=models.CASCADE, related_name="comment_likes"
    )
    like_type = models.CharField(
        max_length=50, blank=True, null=True
    )  # e.g., "like", "love", etc.
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} liked comment {self.comment.id}"

    class Meta:
        unique_together = (
            "user",
            "comment",
        )  # Ensure a user can like a comment only once


class ReportPost(models.Model):
    # The post being reported
    post = models.ForeignKey(
        "Post",
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="The post that is being reported",
    )

    # The user reporting the post
    reporting_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reported_posts",
        help_text="The user who is reporting the post",
    )

    # The owner of the post being reported
    post_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_against_posts",
        help_text="The owner of the post being reported",
    )

    # Indicates if the reported post is a repost
    is_repost = models.BooleanField(
        default=False,
        help_text="Indicates if the reported post is a repost",
    )

    def __str__(self):
        return f"Report by User ID {self.reporting_user.id} on Post ID {self.post.id}"

    class Meta:
        ordering = ["-post"]  # Orders reports by post (most recent first)
        unique_together = ["post", "reporting_user"]  # Prevents duplicate reports
