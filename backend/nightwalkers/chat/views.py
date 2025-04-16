from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer
from chat.serializers import MessageSerializer  # You'll need to create this
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from chat.models import Chat, Message

User = get_user_model()


@csrf_exempt
def get_mutual_follows_with_chats(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        current_user = User.objects.get(id=user_id)
        mutual_follows = current_user.get_mutual_follows()

        response_data = []

        for user in mutual_follows:
            # Get or create chat between current user and mutual follow
            chat, created = Chat.objects.get_or_create_chat(current_user, user)

            # Get last 10 messages (or whatever limit you want)
            messages = Message.objects.filter(chat=chat).order_by("timestamp")

            serializer = UserSerializer(user)
            message_serializer = MessageSerializer(messages, many=True)

            response_data.append(
                {
                    "user": serializer.data,
                    "chat_uuid": str(chat.uuid),
                    "messages": message_serializer.data,
                    "unread_count": Message.objects.filter(chat=chat, read=False)
                    .exclude(sender=current_user)
                    .count(),
                }
            )

        return JsonResponse({"data": response_data}, status=200, safe=False)

    except ObjectDoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
def read_user_messages(request, chat_uuid, sender_id):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)

    try:
        # Verify the chat exists and involves the current user
        chat = Chat.objects.get(uuid=chat_uuid)
        # get sender user from sender_id
        sender = User.objects.get(id=sender_id)
        # Mark unread messages from this sender as read
        Message.objects.filter(chat=chat, sender=sender, read=False).update(read=True)

        return JsonResponse(
            {
                "status": "success",
            },
            status=200,
        )

    except Chat.DoesNotExist:
        return JsonResponse({"error": "Chat not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
def delete_message(request, message_id):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)

    try:
        # get delete type from request body
        import json

        body = json.loads(request.body)
        if "delete_type" not in body:
            return JsonResponse({"error": "Delete type is required"}, status=400)
        message = Message.objects.get(id=message_id)
        delete_type = body["delete_type"]
        if delete_type not in ["no", "self", "everyone"]:
            return JsonResponse({"error": "Invalid delete type"}, status=400)

        # Update the message's is_deleted field based on delete_type
        message.is_deleted = delete_type
        message.save()

        return JsonResponse(
            {
                "status": "success",
                "message": "Message deleted successfully",
            },
            status=200,
        )

    except Message.DoesNotExist:
        return JsonResponse({"error": "Message not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
def edit_message(request, message_id):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)

    try:
        # get new content from request body
        import json

        body = json.loads(request.body)
        if "content" not in body:
            return JsonResponse({"error": "Content is required"}, status=400)

        message = Message.objects.get(id=message_id)
        message.content = body["content"]
        message.save()

        return JsonResponse(
            {
                "status": "success",
                "message": "Message edited successfully",
            },
            status=200,
        )

    except Message.DoesNotExist:
        return JsonResponse({"error": "Message not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
