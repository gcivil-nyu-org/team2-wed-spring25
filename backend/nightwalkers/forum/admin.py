from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import Post, Comment, Like, CommentLike, ReportPost, ReportComment


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ("content_preview", "user_link", "date_created", "replies_count")
    fields = ("content_preview", "user_link", "date_created", "replies_count")
    show_change_link = True
    can_delete = False

    def content_preview(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.id])
        preview = obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
        return format_html('<a href="{}">{}</a>', url, preview)

    content_preview.short_description = "Comment"

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def replies_count(self, obj):
        count = obj.replies.count()
        if count > 0:
            return format_html('<span style="color: #8e44ad;">{}</span>', count)
        return format_html('<span style="color: #7f8c8d;">0</span>')

    replies_count.short_description = "Replies"

    def has_add_permission(self, request, obj=None):
        return False


class LikeInline(admin.TabularInline):
    model = Like
    extra = 0
    readonly_fields = ("user_link", "like_type", "date_created")
    fields = ("user_link", "like_type", "date_created")
    can_delete = False

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def has_add_permission(self, request, obj=None):
        return False


class ReportPostInline(admin.TabularInline):
    model = ReportPost
    extra = 0
    readonly_fields = ("reporting_user_link", "post_owner_link", "is_repost")
    fields = ("reporting_user_link", "post_owner_link", "is_repost")
    can_delete = False

    def reporting_user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.reporting_user.id])
        return format_html(
            '<a href="{}">{}</a>', url, obj.reporting_user.get_full_name()
        )

    reporting_user_link.short_description = "Reported By"

    def post_owner_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.post_owner.id])
        return format_html('<a href="{}">{}</a>', url, obj.post_owner.get_full_name())

    post_owner_link.short_description = "Post Owner"

    def has_add_permission(self, request, obj=None):
        return False


class PostAdmin(admin.ModelAdmin):
    list_display = (
        "post_type_badge",
        "content_preview",
        "user_link",
        "image_count",
        "comments_count",
        "likes_count",
        "date_created",
    )
    list_filter = (
        "is_repost",
        "date_created",
        ("user", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = ("content", "user__email", "user__first_name", "user__last_name")
    readonly_fields = (
        "date_created",
        "date_updated",
        "user_link",
        "image_display",
        "comments_count",
        "likes_count",
        "original_post_link",
        "reposted_by_link",
    )
    inlines = [CommentInline, LikeInline, ReportPostInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            comments_count=Count("comments", distinct=True),
            likes_count=Count("likes", distinct=True),
        )
        return queryset

    def post_type_badge(self, obj):
        if obj.is_repost:
            return format_html(
                '<span style="background-color: #f39c12; color: #fff; '
                "padding: 3px 8px; "
                'border-radius: 5px; font-size: 12px;">Repost</span>'
            )
        return format_html(
            '<span style="background-color: #3498db; color: #fff; padding: 3px 8px; '
            'border-radius: 5px; font-size: 12px;">Original</span>'
        )

    post_type_badge.short_description = "Type"

    def content_preview(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.id])
        preview = obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
        return format_html('<a href="{}">{}</a>', url, preview)

    content_preview.short_description = "Content"

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "Posted By"

    def image_count(self, obj):
        if obj.image_urls:
            return format_html(
                '<span style="color: #27ae60;">{} image(s)</span>', len(obj.image_urls)
            )
        return format_html('<span style="color: #7f8c8d;">No images</span>')

    image_count.short_description = "Images"

    def comments_count(self, obj):
        if hasattr(obj, "comments_count"):
            count = obj.comments_count
        else:
            count = obj.comments.count()
        if count > 0:
            return format_html('<span style="color: #2980b9;">{}</span>', count)
        return format_html('<span style="color: #7f8c8d;">0</span>')

    comments_count.short_description = "Comments"
    comments_count.admin_order_field = "-comments_count"

    def likes_count(self, obj):
        if hasattr(obj, "likes_count"):
            count = obj.likes_count
        else:
            count = obj.likes.count()
        if count > 0:
            return format_html('<span style="color: #c0392b;">{}</span>', count)
        return format_html('<span style="color: #7f8c8d;">0</span>')

    likes_count.short_description = "Likes"
    likes_count.admin_order_field = "-likes_count"

    def image_display(self, obj):
        if not obj.image_urls:
            return "No images"

        html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">'
        for url in obj.image_urls:
            html += (
                f'<div style="margin-bottom: 10px;">'
                f'<img src="{url}" style="max-width: 200px; max-height: 200px; '
                f'border-radius: 5px;" />'
                f'<br/><a href="{url}" target="_blank">View full size</a></div>'
            )
        html += "</div>"
        return format_html(html)

    image_display.short_description = "Images"

    def original_post_link(self, obj):
        if obj.is_repost and obj.original_post:
            url = reverse("admin:forum_post_change", args=[obj.original_post.id])
            return format_html(
                '<a href="{}" style="background-color: #f39c12; color: #fff; '
                "padding: 5px 10px; border-radius: 5px; text-decoration: none; "
                'font-size: 12px;">View Original Post</a>',
                url,
            )
        return "-"

    original_post_link.short_description = "Original Post"

    def reposted_by_link(self, obj):
        if obj.reposted_by:
            url = reverse("admin:accounts_user_change", args=[obj.reposted_by.id])
            return format_html(
                '<a href="{}">{}</a>', url, obj.reposted_by.get_full_name()
            )
        return "-"

    reposted_by_link.short_description = "Reposted By"

    fieldsets = (
        (
            "Post Content",
            {"fields": ("content", "image_display", "comments_count", "likes_count")},
        ),
        ("Post Information", {"fields": ("user_link", "date_created", "date_updated")}),
        (
            "Repost Information",
            {
                "fields": ("is_repost", "original_post_link", "reposted_by_link"),
                "classes": ("collapse",) if not "is_repost" else tuple(),
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("title", "image_urls", "original_post", "reposted_by"),
                "classes": ("collapse",),
            },
        ),
    )


class ReplyInline(admin.TabularInline):
    model = Comment
    fk_name = "parent_comment"
    extra = 0
    readonly_fields = ("content_preview", "user_link", "date_created")
    fields = ("content_preview", "user_link", "date_created")
    verbose_name = "Reply"
    verbose_name_plural = "Replies"
    show_change_link = True
    can_delete = False

    def content_preview(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.id])
        preview = obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
        return format_html('<a href="{}">{}</a>', url, preview)

    content_preview.short_description = "Reply"

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def has_add_permission(self, request, obj=None):
        return False


class CommentLikeInline(admin.TabularInline):
    model = CommentLike
    extra = 0
    readonly_fields = ("user_link", "like_type", "date_created")
    fields = ("user_link", "like_type", "date_created")
    can_delete = False

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def has_add_permission(self, request, obj=None):
        return False


class ReportCommentInline(admin.TabularInline):
    model = ReportComment
    extra = 0
    readonly_fields = ("reporting_user_link", "reason", "date_reported")
    fields = ("reporting_user_link", "reason", "date_reported")
    can_delete = False

    def reporting_user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.reporting_user.id])
        return format_html(
            '<a href="{}">{}</a>', url, obj.reporting_user.get_full_name()
        )

    reporting_user_link.short_description = "Reported By"

    def has_add_permission(self, request, obj=None):
        return False


class CommentAdmin(admin.ModelAdmin):
    list_display = (
        "comment_type_badge",
        "content_preview",
        "user_link",
        "post_link",
        "replies_count",
        "likes_count",
        "date_created",
    )
    list_filter = (
        ("parent_comment", admin.BooleanFieldListFilter),
        "date_created",
        ("user", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = (
        "content",
        "user__email",
        "user__first_name",
        "user__last_name",
        "post__content",
    )
    readonly_fields = (
        "date_created",
        "date_updated",
        "user_link",
        "post_link",
        "parent_comment_link",
        "replies_count",
        "likes_count",
    )
    inlines = [ReplyInline, CommentLikeInline, ReportCommentInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            replies_count=Count("replies", distinct=True),
            likes_count=Count("comment_likes", distinct=True),
        )
        return queryset

    def comment_type_badge(self, obj):
        if obj.parent_comment:
            return format_html(
                '<span style="background-color: #9b59b6; color: #fff; '
                "padding: 3px 8px; "
                'border-radius: 5px; font-size: 12px;">Reply</span>'
            )
        return format_html(
            '<span style="background-color: #2ecc71; color: #fff; '
            "padding: 3px 8px; "
            'border-radius: 5px; font-size: 12px;">Comment</span>'
        )

    comment_type_badge.short_description = "Type"

    def content_preview(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.id])
        preview = obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
        return format_html('<a href="{}">{}</a>', url, preview)

    content_preview.short_description = "Content"

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def post_link(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.post.id])
        preview = (
            obj.post.content[:50] + "..."
            if len(obj.post.content) > 50
            else obj.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_link.short_description = "Post"

    def parent_comment_link(self, obj):
        if obj.parent_comment:
            url = reverse("admin:forum_comment_change", args=[obj.parent_comment.id])
            preview = (
                obj.parent_comment.content[:50] + "..."
                if len(obj.parent_comment.content) > 50
                else obj.parent_comment.content
            )
            return format_html('<a href="{}">{}</a>', url, preview)
        return "-"

    parent_comment_link.short_description = "Parent Comment"

    def replies_count(self, obj):
        if hasattr(obj, "replies_count"):
            count = obj.replies_count
        else:
            count = obj.replies.count()
        if count > 0:
            return format_html('<span style="color: #8e44ad;">{}</span>', count)
        return format_html('<span style="color: #7f8c8d;">0</span>')

    replies_count.short_description = "Replies"
    replies_count.admin_order_field = "-replies_count"

    def likes_count(self, obj):
        if hasattr(obj, "likes_count"):
            count = obj.likes_count
        else:
            count = obj.comment_likes.count()
        if count > 0:
            return format_html('<span style="color: #c0392b;">{}</span>', count)
        return format_html('<span style="color: #7f8c8d;">0</span>')

    likes_count.short_description = "Likes"
    likes_count.admin_order_field = "-likes_count"

    fieldsets = (
        ("Comment Content", {"fields": ("content", "likes_count", "replies_count")}),
        (
            "Comment Information",
            {"fields": ("user_link", "date_created", "date_updated")},
        ),
        (
            "Relations",
            {
                "fields": ("post_link", "parent_comment_link"),
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("post", "parent_comment"),
                "classes": ("collapse",),
            },
        ),
    )


class LikeAdmin(admin.ModelAdmin):
    list_display = ("user_link", "post_preview", "like_type", "date_created")
    list_filter = (
        "date_created",
        "like_type",
        ("user", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "post__content",
    )
    readonly_fields = ("date_created", "user_link", "post_link")

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def post_preview(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.post.id])
        preview = (
            obj.post.content[:50] + "..."
            if len(obj.post.content) > 50
            else obj.post.content
        )

        badge_html = ""
        if obj.post.is_repost:
            badge_html = format_html(
                '<span style="background-color: #f39c12; color: #fff; '
                "padding: 2px 5px; "
                'border-radius: 3px; margin-right: 5px; font-size: 12px;">Repost</span>'
            )
        else:
            badge_html = format_html(
                '<span style="background-color: #3498db; color: #fff; '
                "padding: 2px 5px; "
                'border-radius:3px; margin-right: 5px; font-size: 12px;">'
                "Original</span>"
            )

        return format_html('{}<a href="{}">{}</a>', badge_html, url, preview)

    post_preview.short_description = "Liked Post"

    def post_link(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.post.id])
        preview = (
            obj.post.content[:100] + "..."
            if len(obj.post.content) > 100
            else obj.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_link.short_description = "Post"

    fieldsets = (
        (
            "Like Information",
            {"fields": ("user_link", "post_link", "like_type", "date_created")},
        ),
        (
            "Technical Details",
            {
                "fields": ("user", "post"),
                "classes": ("collapse",),
            },
        ),
    )


class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ("user_link", "comment_preview", "like_type", "date_created")
    list_filter = (
        "date_created",
        "like_type",
        ("user", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "comment__content",
        "comment__post__content",
    )
    readonly_fields = ("date_created", "user_link", "comment_link", "post_link")

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())

    user_link.short_description = "User"

    def comment_preview(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.comment.id])
        preview = (
            obj.comment.content[:50] + "..."
            if len(obj.comment.content) > 50
            else obj.comment.content
        )

        badge_html = ""
        if obj.comment.parent_comment:
            badge_html = format_html(
                '<span style="background-color: #9b59b6; color: #fff; '
                "padding: 2px 5px; "
                'border-radius: 3px; margin-right: 5px; font-size: 12px;">Reply</span>'
            )
        else:
            badge_html = format_html(
                '<span style="background-color: #2ecc71; color: #fff; '
                "padding: 2px 5px; "
                'border-radius: 3px; margin-right: 5px; font-size: 12px;">'
                "Comment</span>"
            )

        return format_html('{}<a href="{}">{}</a>', badge_html, url, preview)

    comment_preview.short_description = "Liked Comment"

    def comment_link(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.comment.id])
        preview = (
            obj.comment.content[:100] + "..."
            if len(obj.comment.content) > 100
            else obj.comment.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    comment_link.short_description = "Comment"

    def post_link(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.comment.post.id])
        preview = (
            obj.comment.post.content[:100] + "..."
            if len(obj.comment.post.content) > 100
            else obj.comment.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_link.short_description = "Post"

    fieldsets = (
        (
            "Like Information",
            {"fields": ("user_link", "comment_link", "like_type", "date_created")},
        ),
        (
            "Related Post",
            {
                "fields": ("post_link",),
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("user", "comment"),
                "classes": ("collapse",),
            },
        ),
    )


class ReportPostAdmin(admin.ModelAdmin):
    list_display = (
        "post_type_badge",
        "post_content",
        "reporting_user_link",
        "post_owner_link",
    )
    list_filter = (
        "is_repost",
        ("reporting_user", admin.RelatedOnlyFieldListFilter),
        ("post_owner", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = ("post__content", "reporting_user__email", "post_owner__email")
    readonly_fields = (
        "post_link",
        "reporting_user_link",
        "post_owner_link",
        "is_repost",
    )

    def post_type_badge(self, obj):
        if obj.is_repost:
            return format_html(
                '<span style="background-color: #f39c12; color: #fff; '
                "padding: 3px 8px; "
                'border-radius: 5px; font-size: 12px;">Repost</span>'
            )
        return format_html(
            '<span style="background-color: #3498db; color: #fff; '
            "padding: 3px 8px; "
            'border-radius: 5px; font-size: 12px;">Original</span>'
        )

    post_type_badge.short_description = "Type"

    def post_content(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.post.id])
        preview = (
            obj.post.content[:50] + "..."
            if len(obj.post.content) > 50
            else obj.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_content.short_description = "Post Content"

    def post_link(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.post.id])
        preview = (
            obj.post.content[:100] + "..."
            if len(obj.post.content) > 100
            else obj.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_link.short_description = "Post"

    def reporting_user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.reporting_user.id])
        return format_html(
            '<a href="{}">{}</a>', url, obj.reporting_user.get_full_name()
        )

    reporting_user_link.short_description = "Reported By"

    def post_owner_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.post_owner.id])
        return format_html('<a href="{}">{}</a>', url, obj.post_owner.get_full_name())

    post_owner_link.short_description = "Post Owner"

    fieldsets = (
        (
            "Report Information",
            {
                "fields": (
                    "post_link",
                    "reporting_user_link",
                    "post_owner_link",
                    "is_repost",
                )
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("post", "reporting_user", "post_owner"),
                "classes": ("collapse",),
            },
        ),
    )


class ReportCommentAdmin(admin.ModelAdmin):
    list_display = (
        "comment_type_badge",
        "comment_content",
        "reporting_user_link",
        "reason_preview",
        "date_reported",
    )
    list_filter = (
        "date_reported",
        ("reporting_user", admin.RelatedOnlyFieldListFilter),
    )
    search_fields = ("comment__content", "reporting_user__email", "reason")
    readonly_fields = (
        "date_reported",
        "comment_link",
        "reporting_user_link",
        "post_link",
    )

    def comment_type_badge(self, obj):
        if obj.comment.parent_comment:
            return format_html(
                '<span style="background-color: #9b59b6; color: #fff; '
                "padding: 3px 8px; "
                'border-radius: 5px; font-size: 12px;">Reply</span>'
            )
        return format_html(
            '<span style="background-color: #2ecc71; color: #fff; padding: 3px 8px; '
            'border-radius: 5px; font-size: 12px;">Comment</span>'
        )

    comment_type_badge.short_description = "Type"

    def comment_content(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.comment.id])
        preview = (
            obj.comment.content[:50] + "..."
            if len(obj.comment.content) > 50
            else obj.comment.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    comment_content.short_description = "Comment Content"

    def reason_preview(self, obj):
        if not obj.reason:
            return "-"
        if len(obj.reason) > 50:
            return obj.reason[:50] + "..."
        return obj.reason

    reason_preview.short_description = "Reason"

    def comment_link(self, obj):
        url = reverse("admin:forum_comment_change", args=[obj.comment.id])
        preview = (
            obj.comment.content[:100] + "..."
            if len(obj.comment.content) > 100
            else obj.comment.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    comment_link.short_description = "Comment"

    def reporting_user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.reporting_user.id])
        return format_html(
            '<a href="{}">{}</a>', url, obj.reporting_user.get_full_name()
        )

    reporting_user_link.short_description = "Reported By"

    def post_link(self, obj):
        url = reverse("admin:forum_post_change", args=[obj.comment.post.id])
        preview = (
            obj.comment.post.content[:100] + "..."
            if len(obj.comment.post.content) > 100
            else obj.comment.post.content
        )
        return format_html('<a href="{}">{}</a>', url, preview)

    post_link.short_description = "Post"

    fieldsets = (
        (
            "Report Information",
            {
                "fields": (
                    "comment_link",
                    "reporting_user_link",
                    "reason",
                    "date_reported",
                )
            },
        ),
        (
            "Related Post",
            {
                "fields": ("post_link",),
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("comment", "reporting_user"),
                "classes": ("collapse",),
            },
        ),
    )


# Register models with their admin classes
admin.site.register(Post, PostAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(Like, LikeAdmin)
admin.site.register(CommentLike, CommentLikeAdmin)
admin.site.register(ReportPost, ReportPostAdmin)
admin.site.register(ReportComment, ReportCommentAdmin)
