# notifications/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from notifications import notification_service
import json

@csrf_exempt
def send_notification(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            title = data.get('title')
            body = data.get('body')
            extra_data = data.get('data', {})
            print(f"Received data: {data}")  # Debugging line
            if not all([user_id, title, body]):
                print("Missing required fields")  # Debugging line
                return JsonResponse(
                    {'error': 'Missing required fields (user_id, title, body)'},
                    status=400
                )
            print(f"Sending notification to user {user_id}")  # Debugging line
            success = notification_service.send_to_user(
                user_id=user_id,
                title=title,
                body=body,
                data=extra_data
            )
            print(f"Notification sent: {success}")  # Debugging line
            
            if success:
                return JsonResponse({'status': 'Notification sent successfully'})
            
            return JsonResponse(
                {'error': 'Failed to send notification'},
                status=400
            )
            
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Invalid JSON payload'},
                status=400
            )
        except Exception as e:
            print(f"Server error: {str(e)}")
            return JsonResponse(
                {'error': f'Server error: {str(e)}'},
                status=500
            )
    
    return JsonResponse(
        {'error': 'Only POST requests are allowed'},
        status=405
    )