"use client";

import UserPostBottom from "@/components/molecules/UserPost/UserPostBottom/UserPostBottom";
import UserPostHeader from "@/components/molecules/UserPost/UserPostHeader/UserPostHeader";
import UserPostBody from "@/components/molecules/UserPost/UserPostBody/UserPostBody";
import useUserPost from "./useUserPost";
import UserImage from "@/components/atom/UserImage/UserImage";
import { getUserFullName } from "@/utils/string";

export default function UserPost({ post, setPosts }) {
  const { commentsCount, setCommentsCount, likesCount, setLikesCount } =
    useUserPost(post.likes_count, post.comments_count);
  return (
    <div className="flex flex-col rounded-lg w-full font-sans mb-2 bg-white border-[1px]">
      {post.is_repost && (
        <div>
          <div className="flex text-xs items-center mx-4 py-2">
            <UserImage
              imageUrl={post.reposted_by.avatar_url}
              width={24}
              height={24}
            />
            <span className="ml-2 font-semibold mr-0 pr-0">
              {getUserFullName(
                post.reposted_by.first_name,
                post.reposted_by.last_name
              )}
            </span>
            <p className="text-slate-600 ml-1">reposted this</p>
          </div>
          <hr className="border-gray-200 mx-4" />
        </div>
      )}
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
        post_user_id={post.user_id}
        is_repost={post.is_repost}
        original_post_id={post.is_repost ? post.original_post_id : null}
      />
    </div>
  );
}
