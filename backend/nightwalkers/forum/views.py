from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from .models import Post, Comment, Like, CommentLike
from accounts.models import Follow
from django.db.models import Count
import json

User = get_user_model()


# Helper function to parse JSON request body
def parse_json_request(request):
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return None


@csrf_exempt
def create_post(request):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

        user_id = data.get("user_id")
        content = data.get("content")
        image_urls = data.get("image_urls", [])
        if not user_id or (not content and not image_urls):
            return JsonResponse(
                {"error": "user_id and content are required"}, status=400
            )

        try:
            # Fetch the user by ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        # Create the post
        post = Post.objects.create(
            user=user, title="", content=content, image_urls=image_urls
        )

        # increase user profile karma by 10
        user.karma += 10
        user.save()

        # Include user details in the response
        return JsonResponse(
            {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "image_urls": post.image_urls,
                "date_created": post.date_created,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "avatar_url": user.get_avatar_url(),
                    "karma": user.karma,
                },
                "status": 201,
            },
            status=201,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def create_repost(request):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse(
                {"error": "Invalid JSON data", "status": 400}, status=400
            )

        user_id = data.get("user_id")
        original_post_id = data.get("original_post_id")
        if not user_id or not original_post_id:
            return JsonResponse(
                {"error": "user_id and original_post_id are required", "status": 400},
                status=400,
            )

        try:
            # Fetch the user by ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found", "status": 404}, status=404)

        try:
            # Fetch the original post by ID
            original_post = Post.objects.get(id=original_post_id)
        except Post.DoesNotExist:
            return JsonResponse(
                {"error": "Original post not found", "status": 404}, status=404
            )

        # Check if the user already reposted the same post
        if Post.objects.filter(user=user, original_post=original_post).exists():
            return JsonResponse(
                {"error": "You have already reposted this post", "status": 400},
                status=400,
            )

        # Create the repost
        repost = Post.objects.create(
            user=user,  # The user creating the repost
            is_repost=True,
            original_post=original_post,
            reposted_by=user,
            title="",  # Optional: You can add a title if needed
            content=original_post.content,  # Copy the original post's content
            image_urls=original_post.image_urls,  # Copy the original post's image URLs
        )

        # increase karma by 5
        user.karma += 5
        user.save()

        # Include repost details in the response
        return JsonResponse(
            {
                "id": repost.id,
                "is_repost": repost.is_repost,
                "original_post": {
                    "id": original_post.id,
                    "content": original_post.content,
                    "user": {
                        "id": original_post.user.id,
                        "username": original_post.user.username,
                        "email": original_post.user.email,
                        "first_name": original_post.user.first_name,
                        "last_name": original_post.user.last_name,
                    },
                },
                "reposted_by": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "date_created": repost.date_created,
                "status": 201,
            },
            status=201,
        )

    return JsonResponse({"error": "Method not allowed", "status": 405}, status=405)


# Get all posts


def get_posts(request):
    if request.method == "GET":
        user_id = request.GET.get("user_id")  # Get the user ID from query parameters
        offset = int(request.GET.get("offset", 0))  # Get the offset (default: 0)
        limit = int(request.GET.get("limit", 5))  # Get the limit (default: 5)

        # Fetch all likes by the current user in a single query
        user_likes = Like.objects.filter(user_id=user_id).values_list(
            "post_id", "like_type"
        )

        # Convert user_likes into a dictionary for quick lookup
        user_likes_dict = {post_id: like_type for post_id, like_type in user_likes}

        # Fetch all follow relationships for the current user
        current_user_following = Follow.objects.filter(
            main_user_id=user_id
        ).values_list("following_user_id", flat=True)

        # Convert current_user_following into a set for quick lookup
        current_user_following_set = set(current_user_following)

        # Annotate posts with distinct likes_count and comments_count
        posts = Post.objects.annotate(
            likes_count=Count("likes", distinct=True),  # Distinct count for likes
            comments_count=Count(
                "comments", distinct=True
            ),  # Distinct count for comments
        ).order_by("-date_created")

        # Prepare the response data
        posts_data = []
        all_posts_so_far = set()
        post_count = 0

        for post in posts[offset:]:  # Apply offset to skip already fetched posts
            if post_count >= limit:  # Stop after fetching the required number of posts
                break

            if post.is_repost:
                # If the post is a repost, fetch the original post details
                original_post = post.original_post

                # If the post is a repost,
                # only show it to the current user
                # if the current user is not following the original author
                if (
                    original_post.user.id in current_user_following_set
                    or original_post.id in all_posts_so_far
                ):
                    continue
                all_posts_so_far.add(original_post.id)

                # Calculate likes and comments for the original post
                original_likes_count = Like.objects.filter(post=original_post).count()
                original_comments_count = Comment.objects.filter(
                    post=original_post
                ).count()

                post_data = {
                    "id": post.id,
                    "original_post_id": original_post.id,
                    "title": original_post.title,
                    "content": original_post.content,
                    "image_urls": original_post.image_urls,
                    "date_created": original_post.date_created,
                    "user_id": original_post.user.id,
                    "user_fullname": original_post.user.get_full_name(),
                    "user_avatar": original_post.user.get_avatar_url(),
                    "user_karma": original_post.user.get_karma(),
                    "comments_count": original_comments_count,
                    "likes_count": original_likes_count,
                    "user_has_liked": original_post.id
                    in user_likes_dict,  # Check if the user has liked the post
                    "like_type": user_likes_dict.get(
                        original_post.id
                    ),  # Get the like_type if the user has liked the post
                    "is_following_author": original_post.user.id
                    in current_user_following_set,
                    # Check if the current user is following the post author
                    "is_repost": post.is_repost,
                    "reposted_by": {
                        "id": post.reposted_by.id,
                        "username": post.reposted_by.username,
                        "email": post.reposted_by.email,
                        "first_name": post.reposted_by.first_name,
                        "last_name": post.reposted_by.last_name,
                        "avatar_url": post.reposted_by.get_avatar_url(),
                    },
                }
                posts_data.append(post_data)
                post_count += 1
                continue

            if post.id in all_posts_so_far:
                continue

            post_data = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "image_urls": post.image_urls,
                "date_created": post.date_created,
                "user_id": post.user.id,
                "user_fullname": post.user.get_full_name(),
                "user_avatar": post.user.get_avatar_url(),
                "comments_count": post.comments_count,
                "user_karma": post.user.get_karma(),
                "likes_count": post.likes_count,
                "user_has_liked": post.id
                in user_likes_dict,  # Check if the user has liked the post
                "like_type": user_likes_dict.get(
                    post.id
                ),  # Get the like_type if the user has liked the post
                "is_following_author": post.user.id in current_user_following_set,
                # Check if the current user is following the post author
            }
            posts_data.append(post_data)
            post_count += 1

        return JsonResponse(
            {
                "posts": posts_data,
                "has_more": len(posts) > (offset + limit),
                # Indicate if there are more posts to fetch
            },
            safe=False,
            status=200,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


# Get a single post by ID
def get_post(request, post_id):
    if request.method == "GET":
        post = get_object_or_404(Post, id=post_id)
        post_data = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_urls": post.image_urls,
            "date_created": post.date_created,
            "user": post.user.get_full_name(),
            "comments": [
                {
                    "id": comment.id,
                    "content": comment.content,
                    "date_created": comment.date_created,
                    "user": comment.user.get_full_name(),
                }
                for comment in post.comments.all()
            ],
            "likes_count": post.likes.count(),
        }
        return JsonResponse(post_data)

    return JsonResponse({"error": "Method not allowed"}, status=405)


# Create a comment on a post
@csrf_exempt
def comments(request, post_id):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

        user_id = data.get("user_id")
        content = data.get("content")
        parent_comment_id = data.get(
            "parent_comment_id"
        )  # Optional field for nested comments

        if not user_id or not content:
            return JsonResponse(
                {"error": "user_id and content are required"}, status=400
            )

        post = get_object_or_404(Post, id=post_id)

        try:
            # Fetch the user by ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        # Check if this is a nested comment (reply to another comment)
        parent_comment = None
        if parent_comment_id:
            try:
                parent_comment = Comment.objects.get(id=parent_comment_id, post=post)
            except Comment.DoesNotExist:
                return JsonResponse({"error": "Parent comment not found"}, status=404)

        # increase karma by 2 for the owner of the post
        post_user = post.user
        post_user.karma += 2
        post_user.save()

        # Create the comment
        comment = Comment.objects.create(
            user=user,
            post=post,
            content=content,
            parent_comment=parent_comment,  # Set to None if not a nested comment
        )

        return JsonResponse(
            {
                "id": comment.id,
                "content": comment.content,
                "date_created": comment.date_created,
                "user": comment.user.get_full_name(),
                "parent_comment_id": (
                    comment.parent_comment.id if comment.parent_comment else None
                ),
                "status": 201,
            },
            status=201,
        )
    elif request.method == "GET":
        try:
            user_id = request.GET.get("user_id")  # Get the current user ID from query parameters

            # Fetch all likes by the current user for comments in this post from the CommentLike table
            user_likes = CommentLike.objects.filter(
                user_id=user_id,
                comment__post_id=post_id,  # Filter likes for comments in this post
            ).values("comment_id", "like_type")

            # Convert user_likes into a dictionary for quick lookup
            user_likes_dict = {
                like["comment_id"]: like["like_type"] for like in user_likes
            }

            # Annotate comments with the total number of likes from the CommentLike table
            comments = (
                Comment.objects.filter(post_id=post_id)
                .select_related("user")
                .annotate(
                    likes_count=Count("comment_likes", distinct=True)  # Count total likes for each comment from CommentLike
                )
                .order_by("-date_created")
            )

            # Serialize the comments along with user details and like information
            comments_data = [
                {
                    "id": comment.id,
                    "post_id": comment.post_id,
                    "content": comment.content,
                    "date_created": comment.date_created,
                    "user": {
                        "id": comment.user.id,
                        "avatar_url": comment.user.avatar_url,
                        "email": comment.user.email,  # Only include if necessary
                        "first_name": comment.user.first_name,
                        "last_name": comment.user.last_name,
                        "user_karma": comment.user.karma,
                    },
                    "likes_count": comment.likes_count,  # Total likes on the comment
                    "user_has_liked": comment.id in user_likes_dict,  # Check if the current user has liked the comment
                    "like_type": user_likes_dict.get(comment.id),  # Get the like_type if the user has liked the comment
                }
                for comment in comments
            ]

            return JsonResponse({"comments": comments_data, "status": 200}, safe=False, status=200)

        except Exception as e:
            print("Error fetching comments:", str(e))  # Logs for debugging
            return JsonResponse({"error": "Internal server error", "status": 500}, status=500)

    return JsonResponse({"error": "Method not allowed", "status": 405}, status=405)



# Like a post
@csrf_exempt
def like_post(request, post_id):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        user_id = data.get("user_id")
        is_liked = data.get("is_liked")
        like_type = data.get("like_type")
        user = User.objects.get(id=user_id)
        post = get_object_or_404(Post, id=post_id)
        # Check if the user has already liked the post
        # if like_type in ["Like", "Clap", "Support", "Heart", "Bulb", "Laugh"]
        # and Like.objects.filter(user=user, post=post, like_type=like_type).exists():
        if Like.objects.filter(user=user, post=post).exists():
            if not is_liked:
                # remove
                Like.objects.filter(user=user, post=post).delete()
                # reducer karma by 1 for the owner of the post
                post_user = post.user
                post_user.karma -= 1
                post_user.save()
            else:
                # update
                Like.objects.filter(user=user, post=post).update(like_type=like_type)
        else:
            # Create a new like
            Like.objects.create(user=user, post=post, like_type=like_type)
            # increase karma by 1 for the owner of the post
            post_user = post.user
            post_user.karma += 1
            post_user.save()
        return JsonResponse(
            {
                "message": "Post liked successfully",
                "likes_count": post.likes.count(),
                "status": 201,
            },
            status=201,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


# Unlike a post
@csrf_exempt
def unlike_post(request, post_id):
    if request.method == "POST":
        user = request.user
        post = get_object_or_404(Post, id=post_id)

        like = Like.objects.filter(user=user, post=post).first()
        if not like:
            return JsonResponse({"error": "You have not liked this post"}, status=400)

        like.delete()
        return JsonResponse(
            {"message": "Post unliked successfully", "likes_count": post.likes.count()},
            status=200,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def follow_unfollow_user(request, user_id):
    """
    View to handle follow/unfollow actions..
    - POST: Follow a user.
    - DELETE: Unfollow a user.
    """

    try:
        data = parse_json_request(request)
        follow = data.get("follow")
        main_user_id = data.get("user_id")
        post_user_id = user_id

        # Get the main user and post user
        main_user = User.objects.get(id=main_user_id)
        post_user = User.objects.get(id=post_user_id)

        if follow:
            # Check if the main user is already following the post user
            if main_user.following.filter(id=post_user_id).exists():
                return JsonResponse(
                    {"error": "You are already following this user"}, status=400
                )

            # Create a new follow relationship
            Follow.objects.create(main_user=main_user, following_user=post_user)
            # increase karma by 3 if someone follows you
            post_user.karma += 3
            post_user.save()
            return JsonResponse({"message": "User followed successfully"}, status=201)

        else:
            # Check if the main user is following the post user
            follow_relationship = Follow.objects.filter(
                main_user=main_user, following_user=post_user
            )
            if not follow_relationship.exists():
                return JsonResponse(
                    {"error": "You are not following this user"}, status=400
                )

            # Delete the follow relationship
            follow_relationship.delete()
            # reduce karma by 3 if someone unfollows you
            post_user.karma -= 3
            post_user.save()
            return JsonResponse({"message": "User unfollowed successfully"}, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




@csrf_exempt
def like_comment(request, comment_id):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON data", "status": 400}, status=400)

        user_id = data.get("user_id")
        is_liked = data.get("is_liked", False)  # Default to False if not provided
        like_type = data.get("like_type", "like")  # Default to "like" if not provided

        # Check if the user exists
        user = get_object_or_404(User, id=user_id)

        # Check if the comment exists
        comment = get_object_or_404(Comment, id=comment_id)

        # Check if the user has already liked the comment
        comment_like = CommentLike.objects.filter(user=user, comment=comment).first()

        if is_liked:
            # If the user wants to like the comment
            if comment_like:
                # Update the like type if the user has already liked the comment
                comment_like.like_type = like_type
                comment_like.save()
                message = "Comment like updated successfully"
            else:
                # Create a new like
                CommentLike.objects.create(user=user, comment=comment, like_type=like_type)
                message = "Comment liked successfully"
        else:
            # If the user wants to unlike the comment
            if comment_like:
                comment_like.delete()
                message = "Comment unliked successfully"
            else:
                return JsonResponse(
                    {"error": "You have not liked this comment", "status": 400}, status=400
                )
        print(message)
        # Return the updated likes count and success message
        return JsonResponse(
            {
                "message": message,
                "likes_count": comment.comment_likes.count(),  # Use the related_name
                "status": 201,
            },
            status=201,
        )

    return JsonResponse({"error": "Method not allowed", "status": 405}, status=405)