"use client";

import UserPostBottom from "@/components/molecules/UserPost/UserPostBottom/UserPostBottom";
import UserPostHeader from "@/components/molecules/UserPost/UserPostHeader/UserPostHeader";
import UserPostBody from "@/components/molecules/UserPost/UserPostBody/UserPostBody";
import useUserPost from "./useUserPost";

export default function UserPost({ post, setPosts }) {
  const { commentsCount, setCommentsCount, likesCount, setLikesCount } =
    useUserPost(post.likes_count, post.comments_count);
  return (
    <div className="flex flex-col rounded-lg w-full font-sans mb-2 bg-white border-[1px]">
      <UserPostHeader
        user_avatar={post.user_avatar}
        user_fullname={post.user_fullname}
        date_created={post.date_created}
        post_user_id={post.user_id}
        is_following_author={post.is_following_author}
        setPosts={setPosts}
      />
      <UserPostBody image_urls={post.image_urls} content={post.content} />
      <UserPostBottom
        user_avatar={post.user_avatar}
        commentsCount={commentsCount}
        likesCount={likesCount}
        setCommentsCount={setCommentsCount}
        setLikesCount={setLikesCount}
        post_id={post.id}
        user_has_liked={post.user_has_liked}
        like_type={post.like_type}
      />
    </div>
  );
}
