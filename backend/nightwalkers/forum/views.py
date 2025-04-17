from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model

from map.models import SavedRoute
from .models import Post, Comment, Like, CommentLike, ReportPost, ReportComment
from accounts.models import Follow
from django.db.models import Count, OuterRef, Subquery, IntegerField, Exists
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
        is_edit = data.get(
            "is_edit", False
        )  # Optional field to indicate if it's an edit
        post_id = data.get("post_id")  # Optional field for editing an existing post
        image_urls = data.get("image_urls", [])
        if is_edit and post_id:
            try:
                post = Post.objects.get(id=post_id)
                post.content = content
                post.image_urls = image_urls
                post.save()
                return JsonResponse(
                    {
                        "id": post.id,
                        "title": post.title,
                        "content": post.content,
                        "image_urls": post.image_urls,
                        "date_created": post.date_created,
                        "user": {
                            "id": post.user.id,
                            "username": post.user.username,
                            "email": post.user.email,
                            "first_name": post.user.first_name,
                            "last_name": post.user.last_name,
                            "avatar_url": post.user.get_avatar_url(),
                            "karma": post.user.karma,
                        },
                        "status": 200,
                    },
                    status=200,
                )
            except Post.DoesNotExist:
                print("Post not found for editing")
                return JsonResponse({"error": "Post not found"}, status=404)

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


def get_user_data(request):
    """
    get total user followers count,
    by find total rows in Follow table
    where following_user = cureent user
    get user karma, its in User table
    get user saved routes counts, by
    finding total rows with user= current user in SavedRoute table
    get user total posts count,
    by finding total rows with user= current user in Post table
    """
    if request.method == "GET":
        user_id = request.GET.get("user_id")
        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        total_followers = Follow.objects.filter(following_user=user).count()
        print("user: ", user)
        user_karma = user.karma
        total_posts = Post.objects.filter(user=user).count()
        # get Total Saved Routers count by current user using SavedRoute model
        total_saved_routes = SavedRoute.objects.filter(user=user).count()
        return JsonResponse(
            {
                "total_followers": total_followers,
                "user_karma": user_karma,
                "total_posts": total_posts,
                "total_saved_routes": total_saved_routes,
                "status": 200,
            },
            status=200,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


# Get all posts
def get_posts(request):
    if request.method == "GET":
        user_id = request.GET.get("user_id")  # Get the user ID from query parameters
        offset = int(request.GET.get("offset", 0))  # Get the offset (default: 0)
        limit = int(request.GET.get("limit", 5))  # Get the limit (default: 5)
        settings_type = request.GET.get(
            "settings_type", ""
        )  # Get the settings type (default: "")
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

        # get all the posts that the user has reported
        reported_posts = ReportPost.objects.filter(
            reporting_user_id=user_id
        ).values_list("post_id", flat=True)
        # create set for quick lookup
        reported_posts = set(reported_posts)

        # Convert current_user_following into a set for quick lookup
        current_user_following_set = set(current_user_following)
        user = get_object_or_404(User, id=user_id)
        print("settings_type:", settings_type)
        # Annotate posts with distinct likes_count and comments_count
        if settings_type == "":
            posts = Post.objects.annotate(
                likes_count=Count("likes", distinct=True),  # Distinct count for likes
                comments_count=Count(
                    "comments", distinct=True
                ),  # Distinct count for comments
            ).order_by("-date_created")
        elif settings_type == "posts":
            posts = (
                Post.objects.filter(user=user, is_repost=False)
                .annotate(
                    likes_count=Count(
                        "likes", distinct=True
                    ),  # Distinct count for likes
                    comments_count=Count(
                        "comments", distinct=True
                    ),  # Distinct count for comments
                )
                .order_by("-date_created")
            )
        elif settings_type == "reactions":
            # show all the post user has liked
            posts = (
                Post.objects.filter(likes__user=user)
                .annotate(
                    likes_count=Count(
                        "likes", distinct=True
                    ),  # Distinct count for likes
                    comments_count=Count(
                        "comments", distinct=True
                    ),  # Distinct count for comments
                )
                .order_by("-date_created")
            )
        elif settings_type == "reports":
            # show all the post user has reported
            posts = (
                Post.objects.filter(reports__reporting_user=user)
                .annotate(
                    likes_count=Count(
                        "likes", distinct=True
                    ),  # Distinct count for likes
                    comments_count=Count(
                        "comments", distinct=True
                    ),  # Distinct count for comments
                )
                .order_by("-date_created")
            )
        elif settings_type == "comments":
            # find all the posts_id where user has commented \
            # then filter the posts and annotate and order by \
            # date and paginate amd return
            posts = (
                Post.objects.filter(comments__user=user)
                .annotate(
                    likes_count=Count(
                        "likes", distinct=True
                    ),  # Distinct count for likes
                    comments_count=Count(
                        "comments", distinct=True
                    ),  # Distinct count for comments
                )
                .order_by("-date_created")
            )
        elif settings_type == "flagged_posts":
            # show all the posts made by user that have been reported
            # so find all the posts made by user that have been reported,
            # then filter the posts and annotate and order by date

            posts = Post.objects.filter(
                user=user
            ).annotate(
                likes_count=Count("likes", distinct=True),
                comments_count=Count("comments", distinct=True),
                is_reported=Exists(
                    ReportPost.objects.filter(post=OuterRef('pk'))
                )
            ).filter(
                is_reported=True
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
                    post=original_post,
                ).count()

                post_data = {
                    "id": post.id,
                    "is_reported": original_post.id in reported_posts,
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
                "is_reported": post.id in reported_posts,
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
        try:
            print(f"All posts in DB: {Post.objects.all().values_list('id', flat=True)}")
            post = get_object_or_404(Post, id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found"}, status=404)
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
        return JsonResponse(post_data, status=200)

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
        is_edit = data.get(
            "is_edit", False
        )  # Optional field to indicate if it's an edit

        if is_edit:
            # parent comment id is the comment id of the comment that is being edited
            if not parent_comment_id:
                return JsonResponse(
                    {"error": "comment_id is required for editing"}, status=400
                )
            try:
                print("Editing comment with ID:", parent_comment_id)
                print("content:", content)
                comment = Comment.objects.get(id=parent_comment_id, user_id=user_id)
                comment.content = content
                comment.save()
                return JsonResponse(
                    {
                        "id": comment.id,
                        "content": comment.content,
                        "date_created": comment.date_created,
                        "user": comment.user.get_full_name(),
                        "parent_comment_id": (
                            comment.parent_comment.id
                            if comment.parent_comment
                            else None
                        ),
                        "status": 200,
                    },
                    status=200,
                )
            except Comment.DoesNotExist:
                return JsonResponse({"error": "Comment not found"}, status=404)

        if not user_id or not content:
            return JsonResponse(
                {"error": "user_id and content are required"}, status=400
            )

        post = get_object_or_404(Post, id=post_id)

        try:
            # Fetch the user by ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            print("User not found")
            return JsonResponse({"error": "User not found"}, status=404)

        # Check if this is a nested comment (reply to another comment)
        parent_comment = None
        if parent_comment_id:
            try:
                parent_comment = Comment.objects.get(id=parent_comment_id, post=post)
            except Comment.DoesNotExist:
                print("Parent comment not found")
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
            # Get query parameters
            user_id = request.GET.get("user_id")  # Required: Current user ID
            parent_comment_id = request.GET.get(
                "parent_comment_id", 0
            )  # Optional: Parent comment ID
            page = int(
                request.GET.get("page", 1)
            )  # Pagination: Current page (default: 1)
            limit = int(
                request.GET.get("limit", 5)
            )  # Pagination: Comments per page (default: 5)

            if not user_id:
                return JsonResponse({"error": "user_id is required"}, status=400)

            # Fetch the parent comment if parent_comment_id is provided
            parent_comment = None
            if parent_comment_id != 0:
                try:
                    parent_comment = Comment.objects.get(
                        id=parent_comment_id, post_id=post_id
                    )
                except Comment.DoesNotExist:
                    pass

            # Fetch all likes by the current user for comments in this post
            user_likes = CommentLike.objects.filter(
                user_id=user_id,
                comment__post_id=post_id,  # Filter likes for comments in this post
            ).values("comment_id", "like_type")

            # Convert user_likes into a dictionary for quick lookup
            user_likes_dict = {
                like["comment_id"]: like["like_type"] for like in user_likes
            }

            # Subquery to count replies for each comment
            replies_subquery = (
                Comment.objects.filter(parent_comment_id=OuterRef("id"))
                .values("parent_comment_id")
                .annotate(count=Count("id"))
                .values("count")
            )

            # Annotate comments with the total number of likes and replies
            comments_query = (
                Comment.objects.filter(
                    post_id=post_id, parent_comment=parent_comment
                )  # Filter by post and parent comment
                .select_related("user")
                .annotate(
                    likes_count=Count(
                        "comment_likes", distinct=True
                    ),  # Count total likes for each comment
                    replies_count=Subquery(
                        replies_subquery, output_field=IntegerField()
                    ),  # Count total replies for each comment
                )
                .order_by("-date_created")  # Order by most recent
            )

            # Paginate the comments
            paginator = Paginator(comments_query, limit)
            page_comments = paginator.get_page(page)

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
                    "replies_count": comment.replies_count
                    or 0,  # Total replies to the comment
                    # Check if the current user has liked the comment
                    "user_has_liked": comment.id in user_likes_dict,
                    "like_type": user_likes_dict.get(
                        comment.id
                    ),  # Get the like_type if the user has liked the comment
                }
                for comment in page_comments
            ]

            # Return the paginated comments and pagination metadata
            return JsonResponse(
                {
                    "comments": comments_data,
                    # Indicates if there are more comments to load
                    "has_more": page_comments.has_next(),
                    "status": 200,
                },
                safe=False,
                status=200,
            )

        except Exception as e:
            print("Error fetching comments:", str(e))  # Logs for debugging
            return JsonResponse(
                {"error": "Internal server error", "status": 500}, status=500
            )
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
        # and Like.objects.filter(user=user, post=post, like_type=like_type).exists()::
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
            return JsonResponse(
                {"error": "Invalid JSON data", "status": 400}, status=400
            )

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
                CommentLike.objects.create(
                    user=user, comment=comment, like_type=like_type
                )
                message = "Comment liked successfully"
        else:
            # If the user wants to unlike the comment
            if comment_like:
                comment_like.delete()
                message = "Comment unliked successfully"
            else:
                return JsonResponse(
                    {"error": "You have not liked this comment", "status": 400},
                    status=400,
                )
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


@csrf_exempt
def report_post(request, post_id):
    if request.method == "POST":
        data = parse_json_request(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

        reporting_user_id = data.get("reporting_user_id")
        post_owner_id = data.get("post_owner_id")
        repost_user_id = data.get("repost_user_id")

        # Check if the reporting user exists
        try:
            reporting_user = User.objects.get(id=reporting_user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "Reporting user not found"}, status=404)

        # Check if the post owner exists
        try:
            post_owner = User.objects.get(id=post_owner_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "Post owner not found"}, status=404)

        # Check if the repost user exists (if provided)
        repost_user = None
        if repost_user_id:
            try:
                repost_user = User.objects.get(id=repost_user_id)
            except User.DoesNotExist:
                return JsonResponse({"error": "Repost user not found"}, status=404)

        # Check if the post exists
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found"}, status=404)

        # Check if the user has already reported this post
        existing_report = ReportPost.objects.filter(
            post=post,
            reporting_user=reporting_user,
            post_owner=post_owner,
        ).exists()

        if existing_report:
            return JsonResponse(
                {"error": "You have already reported this post"}, status=400
            )

        # Create a new report
        ReportPost.objects.create(
            post=post,
            reporting_user=reporting_user,
            post_owner=post_owner,
            is_repost=bool(repost_user),  # Set is_repost based on repost_user
        )

        # Deduct karma from the post owner
        post_owner.karma -= 10
        post_owner.save()

        # Deduct karma from the repost user (if applicable)
        if repost_user:
            repost_user.karma -= 10
            repost_user.save()

        return JsonResponse({"message": "Post reported successfully"}, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def report_comment(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405,
        )

    try:
        # Parse the JSON data from the request body
        data = parse_json_request(request)
        if not data:
            return JsonResponse(
                {"error": "Invalid JSON data."},
                status=400,
            )
        comment_id = data.get("comment_id")
        reporting_user_id = data.get("user_id")
        reason = data.get("reason")  # Optional reason field
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON data."},
            status=400,
        )

    if not comment_id or not reporting_user_id:
        return JsonResponse(
            {"error": "Both comment_id and user_id are required."},
            status=400,
        )

    # Fetch the comment and reporting user
    comment = get_object_or_404(Comment, id=comment_id)
    reporting_user = get_object_or_404(get_user_model(), id=reporting_user_id)

    # Check if the user has already reported this comment
    if ReportComment.objects.filter(
        comment=comment, reporting_user=reporting_user
    ).exists():
        return JsonResponse(
            {"error": "User Already Reported This Comment."},
            status=400,
        )

    # Create the report with the reason (if provided)
    ReportComment.objects.create(
        comment=comment,
        reporting_user=reporting_user,
        reason=reason,  # Optional reason field
    )

    # Decrease the karma of the user who created the comment by 5
    comment_user = comment.user
    comment_user.karma -= 5
    comment_user.save()

    return JsonResponse(
        {"message": "Comment reported successfully. Karma decreased by 5."},
        status=201,
    )


@csrf_exempt
def delete_comment(request, post_id, comment_id):
    if request.method != "DELETE":
        return JsonResponse(
            {"error": "Only DELETE requests are allowed."},
            status=405,
        )

    try:
        # Fetch the post and comment
        post = get_object_or_404(Post, id=post_id)
        comment = get_object_or_404(Comment, id=comment_id, post=post)

        # Count the number of comments before deletion
        comments_before = Comment.objects.filter(post=post).count()

        # Delete the comment (this will cascade to delete all replies)
        comment.delete()

        # Count the number of comments after deletion
        comments_after = Comment.objects.filter(post=post).count()

        # Calculate the number of comments deleted
        total_deleted = comments_before - comments_after

        return JsonResponse(
            {
                "message": "Comment deleted successfully.",
                "total_deleted": total_deleted,
                "status": 200,
            },
            status=200,
        )
    except Comment.DoesNotExist:
        return JsonResponse(
            {"error": "Comment not found."},
            status=404,
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500,
        )


@csrf_exempt
def delete_post(request, post_id):
    if request.method != "DELETE":
        return JsonResponse(
            {"error": "Only DELETE requests are allowed."},
            status=405,
        )

    # first get the post, store it
    # then delete all the posts where original_post = post
    # then delete the post itself
    try:
        post = get_object_or_404(Post, id=post_id)
        # Delete all reposts of this post
        Post.objects.filter(original_post=post).delete()
        # Delete the original post
        post.delete()

        return JsonResponse(
            {
                "message": "Post and its reposts deleted successfully.",
                "status": 200,
            },
            status=200,
        )
    except Post.DoesNotExist:
        return JsonResponse(
            {"error": "Post not found."},
            status=404,
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500,
        )
