from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like
import json

User = get_user_model()

# Helper function to parse JSON request body
def parse_json_request(request):
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return None

# Create a new post
@csrf_exempt
def create_post(request):
    if request.method == 'POST':
        data = parse_json_request(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

        user = request.user
        title = data.get('title')
        content = data.get('content')
        image_urls = data.get('image_urls', [])

        if not title or not content:
            return JsonResponse({'error': 'Title and content are required'}, status=400)

        post = Post.objects.create(
            user=user,
            title=title,
            content=content,
            image_urls=image_urls
        )
        return JsonResponse({
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'image_urls': post.image_urls,
            'date_created': post.date_created,
            'user': post.user.get_full_name()
        }, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get all posts
def get_posts(request):
    if request.method == 'GET':
        posts = Post.objects.all().order_by('-date_created')
        posts_data = [{
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'image_urls': post.image_urls,
            'date_created': post.date_created,
            'user': post.user.get_full_name(),
            'comments_count': post.comments.count(),
            'likes_count': post.likes.count()
        } for post in posts]
        return JsonResponse(posts_data, safe=False)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Get a single post by ID
def get_post(request, post_id):
    if request.method == 'GET':
        post = get_object_or_404(Post, id=post_id)
        post_data = {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'image_urls': post.image_urls,
            'date_created': post.date_created,
            'user': post.user.get_full_name(),
            'comments': [{
                'id': comment.id,
                'content': comment.content,
                'date_created': comment.date_created,
                'user': comment.user.get_full_name()
            } for comment in post.comments.all()],
            'likes_count': post.likes.count()
        }
        return JsonResponse(post_data)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Create a comment on a post
@csrf_exempt
def create_comment(request, post_id):
    if request.method == 'POST':
        data = parse_json_request(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

        user = request.user
        content = data.get('content')

        if not content:
            return JsonResponse({'error': 'Content is required'}, status=400)

        post = get_object_or_404(Post, id=post_id)
        comment = Comment.objects.create(
            user=user,
            post=post,
            content=content
        )
        return JsonResponse({
            'id': comment.id,
            'content': comment.content,
            'date_created': comment.date_created,
            'user': comment.user.get_full_name()
        }, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Like a post
@csrf_exempt
def like_post(request, post_id):
    if request.method == 'POST':
        user = request.user
        post = get_object_or_404(Post, id=post_id)

        # Check if the user has already liked the post
        if Like.objects.filter(user=user, post=post).exists():
            return JsonResponse({'error': 'You have already liked this post'}, status=400)

        Like.objects.create(user=user, post=post)
        return JsonResponse({
            'message': 'Post liked successfully',
            'likes_count': post.likes.count()
        }, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# Unlike a post
@csrf_exempt
def unlike_post(request, post_id):
    if request.method == 'POST':
        user = request.user
        post = get_object_or_404(Post, id=post_id)

        like = Like.objects.filter(user=user, post=post).first()
        if not like:
            return JsonResponse({'error': 'You have not liked this post'}, status=400)

        like.delete()
        return JsonResponse({
            'message': 'Post unliked successfully',
            'likes_count': post.likes.count()
        }, status=200)

    return JsonResponse({'error': 'Method not allowed'}, status=405)