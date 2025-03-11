from django.contrib import admin
from .models import Post, Comment, Like


class PostAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "content",
        "image_urls",
        "date_created",
        "date_updated",
    )  # Fields to display in the list view
    list_filter = ("date_created", "user")  # Filters to add in the sidebar
    search_fields = ("title", "content")  # Fields to search by
    readonly_fields = (
        "date_created",
        "date_updated",
    )  # Fields that should be read-only

    # Optionally, you can customize the form fields
    fieldsets = (
        (None, {"fields": ("user", "title", "content", "image_urls")}),
        (
            "Dates",
            {
                "fields": ("date_created", "date_updated"),
                "classes": ("collapse",),  # This makes the section collapsible
            },
        ),
    )


# Register the Post model with the PostAdmin class
admin.site.register(Post, PostAdmin)


class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "date_created", "date_updated")
    list_filter = ("date_created", "user")
    search_fields = ("content",)
    readonly_fields = ("date_created", "date_updated")


admin.site.register(Comment, CommentAdmin)


class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "date_created")
    list_filter = ("date_created", "user")
    search_fields = ("user__email", "post__title")  # Search by user email or post title


admin.site.register(Like, LikeAdmin)
