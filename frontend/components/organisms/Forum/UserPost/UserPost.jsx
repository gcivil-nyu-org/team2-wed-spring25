"use client";

import UserPostBottom from "@/components/molecules/UserPost/UserPostBottom/UserPostBottom";
import UserPostHeader from "@/components/molecules/UserPost/UserPostHeader/UserPostHeader";
import UserPostBody from "@/components/molecules/UserPost/UserPostBody/UserPostBody";
import useUserPost from "./useUserPost";
import UserImage from "@/components/atom/UserImage/UserImage";
import { getUserFullName } from "@/utils/string";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

export default function UserPost({ post, setPosts }) {
  const { commentsCount, setCommentsCount, likesCount, setLikesCount } =
    useUserPost(post.likes_count, post.comments_count);

  return (
    <div className="flex flex-col rounded-lg w-full font-sans mb-2 bg-bg-post border-dark relative">
      {post.is_repost && (
        <div>
          <div className="flex text-xs items-center mx-4 py-2">
            <UserImage
              imageUrl={post.reposted_by.avatar_url ?? fallbackUserProfileImage}
              width={24}
              height={24}
            />
            <span className="ml-2 font-semibold mr-0 pr-0 text-forum-subheading">
              {getUserFullName(
                post.reposted_by.first_name,
                post.reposted_by.last_name
              )}
            </span>
            <p className="text-forum-subheading2 ml-1">reposted this</p>
          </div>
          <hr className="border-top-light mx-4" />
        </div>
      )}
      <UserPostHeader
        user_avatar={post.user_avatar ?? fallbackUserProfileImage}
        user_fullname={post.user_fullname}
        date_created={post.date_created}
        post_user_id={post.user_id}
        is_following_author={post.is_following_author}
        setPosts={setPosts}
        user_karma={post.user_karma}
        post_id={post.id}
        image_urls={post.image_urls}
        content={post.content}
        is_repost={post.is_repost}
        original_post_id={post.original_post_id}
      />
      <UserPostBody
        image_urls={post.image_urls ?? [fallbackUserProfileImage]}
        content={post.content}
      />
      <UserPostBottom
        commentsCount={commentsCount}
        likesCount={likesCount}
        setCommentsCount={setCommentsCount}
        setLikesCount={setLikesCount}
        setPosts={setPosts}
        post={post}
      />
    </div>
  );
}
