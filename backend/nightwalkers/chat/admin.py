from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.db.models import Count, Max
from django.template.response import TemplateResponse
from django.http import JsonResponse
from .models import Chat, Message


class ChatAdmin(admin.ModelAdmin):
    list_display = (
        "chat_name",
        "user1_link",
        "user2_link",
        "message_count",
        "latest_message",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = (
        "user1__email",
        "user1__first_name",
        "user1__last_name",
        "user2__email",
        "user2__first_name",
        "user2__last_name",
        "messages__content",
    )
    readonly_fields = (
        "created_at",
        "uuid",
        "user1_link",
        "user2_link",
        "message_count",
        "latest_message_preview",
        "message_list",
    )

    # Disable add permission
    def has_add_permission(self, request):
        return False

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:chat_id>/messages/",
                self.admin_site.admin_view(self.view_messages),
                name="chat_messages",
            ),
            path(
                "<int:chat_id>/messages/json/",
                self.admin_site.admin_view(self.get_messages_json),
                name="chat_messages_json",
            ),
        ]
        return custom_urls + urls

    def view_messages(self, request, chat_id):
        """View for displaying paginated messages for a chat"""
        chat = Chat.objects.get(id=chat_id)

        # Debug info - print the resolved URL
        json_url = reverse("admin:chat_messages_json", args=[chat_id])
        print(f"JSON endpoint URL: {json_url}")

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "chat": chat,
            "title": (
                f"Messages in chat between {chat.user1.get_full_name()} "
                f"and {chat.user2.get_full_name()}"
            ),
        }
        return TemplateResponse(request, "admin/chat/messages.html", context)

    def get_messages_json(self, request, chat_id):
        """JSON endpoint for loading messages with pagination"""
        try:
            # Get the chat object
            chat = Chat.objects.get(id=chat_id)

            # Get pagination parameters
            page = int(request.GET.get("page", 1))
            page_size = 20

            # Calculate offset
            offset = (page - 1) * page_size

            # Print debug info
            print(f"Fetching messages for chat {chat_id}, page {page}, offset {offset}")

            # Get messages for the requested page
            messages = Message.objects.filter(chat=chat).order_by("-timestamp")[
                offset : offset + page_size
            ]

            # Print count for debugging
            print(f"Found {messages.count()} messages")

            # Format messages for JSON response
            messages_data = []
            for msg in messages:
                messages_data.append(
                    {
                        "id": msg.id,
                        "sender_name": msg.sender.get_full_name(),
                        "sender_id": msg.sender.id,
                        "content": msg.content,
                        "timestamp": msg.timestamp.strftime("%b %d, %Y, %H:%M"),
                        "read": msg.read,
                    }
                )

            # Get total count for pagination
            total_count = Message.objects.filter(chat=chat).count()
            total_pages = max(1, (total_count + page_size - 1) // page_size)

            # Debug info
            print(f"Total messages: {total_count}, Total pages: {total_pages}")

            # Create response
            response_data = {
                "messages": messages_data,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_count": total_count,
                },
            }

            return JsonResponse(response_data)

        except Exception as e:
            import traceback

            print(f"Error in get_messages_json: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse(
                {
                    "error": str(e),
                    "messages": [],
                    "pagination": {
                        "current_page": 1,
                        "total_pages": 1,
                        "total_count": 0,
                    },
                }
            )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            msg_count=Count("messages"), last_msg_time=Max("messages__timestamp")
        )
        return queryset.order_by("-last_msg_time")

    def chat_name(self, obj):
        return f"Chat {obj.uuid}"

    chat_name.short_description = "Chat ID"

    def user1_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user1.id])
        return format_html('<a href="{}">{}</a>', url, obj.user1.get_full_name())

    user1_link.short_description = "User 1"

    def user2_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user2.id])
        return format_html('<a href="{}">{}</a>', url, obj.user2.get_full_name())

    user2_link.short_description = "User 2"

    def message_count(self, obj):
        if hasattr(obj, "msg_count"):
            return obj.msg_count
        return obj.messages.count()

    message_count.short_description = "Messages"
    message_count.admin_order_field = "msg_count"

    def latest_message(self, obj):
        latest = obj.messages.order_by("-timestamp").first()
        if latest:
            return format_html(
                '<span title="{}">{}...</span> <small style="color: #666">- {}</small>',
                latest.content,
                (
                    latest.content[:40] + "..."
                    if len(latest.content) > 40
                    else latest.content
                ),
                latest.timestamp.strftime("%b %d, %Y, %H:%M"),
            )
        return "No messages"

    latest_message.short_description = "Latest Message"
    latest_message.admin_order_field = "last_msg_time"

    def latest_message_preview(self, obj):
        latest = obj.messages.order_by("-timestamp").first()
        if latest:
            sender_url = reverse("admin:accounts_user_change", args=[latest.sender.id])
            sender_name = latest.sender.get_full_name()
            return format_html(
                '<div style="margin-bottom: 10px;"><strong><a href="{}">{}</a></strong>'
                " - {}</div>"
                '<div style="padding: 10px; '
                'border-radius: 5px;">{}</div>',
                sender_url,
                sender_name,
                latest.timestamp.strftime("%b %d, %Y, %H:%M"),
                latest.content,
            )
        return "No messages"

    latest_message_preview.short_description = "Latest Message"

    def message_list(self, obj):
        """Link to the custom message view with pagination"""
        url = reverse("admin:chat_messages", args=[obj.id])
        return format_html(
            '<a href="{}" class="button" style="background-color: #3498db; '
            "color: white; "
            "padding: 8px 15px; text-decoration: none; border-radius: 4px; "
            'display: inline-block; margin-top: 10px;">View All Messages</a>',
            url,
        )

    message_list.short_description = "Chat Messages"

    fieldsets = (
        (
            "Chat Information",
            {"fields": ("uuid", "user1_link", "user2_link", "created_at")},
        ),
        ("Chat Statistics", {"fields": ("message_count", "latest_message_preview")}),
        ("Messages", {"fields": ("message_list",)}),
    )


class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "chat_link",
        "user_names",
        "sender_link",
        "content_preview",
        "timestamp",
        "read",
    )
    list_filter = ("timestamp", "read", "sender")
    search_fields = (
        "content",
        "sender__email",
        "sender__first_name",
        "sender__last_name",
    )
    readonly_fields = (
        "timestamp",
        "sender_link",
        "chat_link",
        "user_names",
        "other_messages",
    )
    date_hierarchy = "timestamp"
    list_per_page = 50

    # Disable add permission for messages
    def has_add_permission(self, request):
        return False

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("sender", "chat", "chat__user1", "chat__user2")

    def content_preview(self, obj):
        if len(obj.content) > 80:
            return obj.content[:80] + "..."
        return obj.content

    content_preview.short_description = "Message"

    def sender_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.sender.id])
        return format_html('<a href="{}">{}</a>', url, obj.sender.get_full_name())

    sender_link.short_description = "From"

    def chat_link(self, obj):
        url = reverse("admin:chat_chat_change", args=[obj.chat.id])
        return format_html('<a href="{}">{}</a>', url, f"Chat {obj.chat.uuid}")

    chat_link.short_description = "Chat"

    def user_names(self, obj):
        user1_url = reverse("admin:accounts_user_change", args=[obj.chat.user1.id])
        user2_url = reverse("admin:accounts_user_change", args=[obj.chat.user2.id])
        return format_html(
            '<a href="{}">{}</a> and <a href="{}">{}</a>',
            user1_url,
            obj.chat.user1.get_full_name(),
            user2_url,
            obj.chat.user2.get_full_name(),
        )

    user_names.short_description = "Between"

    def other_messages(self, obj):
        # Get 5 messages before and after the current message
        current_msg_time = obj.timestamp

        # Get messages from the same chat
        queryset = Message.objects.filter(chat=obj.chat)

        # Get messages around the current one
        earlier_messages = list(
            queryset.filter(timestamp__lt=current_msg_time).order_by("-timestamp")[:5]
        )

        later_messages = list(
            queryset.filter(timestamp__gt=current_msg_time).order_by("timestamp")[:5]
        )

        # Combine and sort by timestamp
        context_messages = earlier_messages + later_messages

        if not context_messages:
            return "No other messages in this conversation"

        html = '<div style="max-height: 300px; overflow-y: auto;">'
        html += "<h4>Context Messages</h4>"
        html += '<table style="width: 100%;">'

        for msg in sorted(context_messages, key=lambda x: x.timestamp):
            if msg.id == obj.id:
                continue

            sender_url = reverse("admin:accounts_user_change", args=[msg.sender.id])
            msg_url = reverse("admin:chat_message_change", args=[msg.id])

            if msg.sender == obj.sender:
                row_style = "background-color: #f0f7ff;"
            else:
                row_style = "background-color: #f9f9f9;"

            html += f"""
            <tr style="{row_style}">
                <td style="padding: 8px; width: 15%;">
                    <a href="{sender_url}">{msg.sender.get_full_name()}</a>
                </td>
                <td style="padding: 8px; width: 65%;">
                    <a href="{msg_url}">{msg.content}</a>
                </td>
                <td style="padding: 8px; width: 20%;">
                    <small>{msg.timestamp.strftime("%b %d, %Y, %H:%M")}</small>
                </td>
            </tr>
            """

        html += "</table></div>"
        return format_html(html)

    other_messages.short_description = "Context Messages"

    actions = ["mark_as_read"]

    def mark_as_read(self, request, queryset):
        updated = queryset.update(read=True)
        self.message_user(request, f"{updated} messages have been marked as read.")

    mark_as_read.short_description = "Mark selected messages as read"

    fieldsets = (
        (
            "Message Information",
            {"fields": ("content", "sender_link", "timestamp", "read")},
        ),
        ("Chat Information", {"fields": ("chat_link", "user_names")}),
        ("Message Context", {"fields": ("other_messages",)}),
    )


admin.site.register(Chat, ChatAdmin)
admin.site.register(Message, MessageAdmin)
