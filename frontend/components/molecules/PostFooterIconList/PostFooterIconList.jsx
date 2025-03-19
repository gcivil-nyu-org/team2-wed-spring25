import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import IconText from "@/components/molecules/IconText/IconText";
import LikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip";
import { apiPost } from "@/utils/fetch/fetch";
import { useState } from "react";

const PostFooterIconList = ({
  handleClickOnComment,
  post_id,
  user_has_liked,
  like_type,
  setLikesCount,
  post_user_id,
  is_repost,
  original_post_id,
  setPosts,
  post,
}) => {
  const iconsData = [
    {
      src: "/icons/like.svg",
      width: 12,
      height: 12,
      alt: "Like",
      text: "Like",
    },
    {
      src: "/icons/comment.svg",
      width: 20,
      height: 20,
      alt: "Comment",
      text: "Comment",
    },
    {
      src: "/icons/repost.svg",
      width: 15,
      height: 15,
      alt: "Repost",
      text: "Repost",
    },
    {
      src: "/icons/send.svg",
      width: 12,
      height: 12,
      alt: "Send",
      text: "Send",
    },
  ];

  const [userHasLiked, setUserHasLiked] = useState(user_has_liked);
  const [likeType, setLikeType] = useState(like_type);
  const { showError, showWarning, showSuccess } = useNotification();
  const handleRepost = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user.id === post_user_id) {
      //show toast
      showWarning("You can't repost your own post");
      return;
    }
    // repost
    try {
      // const response
      const user = JSON.parse(localStorage.getItem("user"));

      const newRepost = {
        id: 0,
        original_post_id: post.id,
        title: post.title,
        content: post.content,
        image_urls: post.image_urls,
        date_created: new Date().toISOString(),
        user_id: post.user_id,
        user_fullname: post.user_fullname,
        user_avatar: post.user_avatar,
        user_karma: post.user_karma,
        comments_count: post.comments_count,
        likes_count: post.likes_count,
        user_has_liked: post.user_has_liked,
        like_type: post.like_type,
        is_following_author: post.is_following_author,
        is_repost: true,
        reposted_by: {
          id: user.id,
          username: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar,
        },
      };
      setPosts((prevPosts) => {
        //add new repost at start, but remove the old one iwth same id
        //first filter out the old repost
        const newPosts = prevPosts.filter((p) => p.id !== post.id);
        //add new repost at start
        newPosts.unshift(newRepost);
        return newPosts;
      });
      const response = await apiPost("/api/forum/posts/repost/", {
        user_id: user.id,
        original_post_id: is_repost ? original_post_id : post_id,
      });

      if (response.status === 201) {
        showSuccess("Post reposted successfully");
      }
    } catch (error) {
      showError(error.message);
      console.error("Error reposting post", error);
    }
  };
  return (
    <div className="flex flex-1 relative">
      <div className="flex-1 group">
        {/* like option list */}
        <LikeIconTextWithTooltip
          iconData={iconsData[0]}
          post_id={post_id}
          userHasLiked={userHasLiked}
          setUserHasLiked={setUserHasLiked}
          likeType={likeType}
          setLikeType={setLikeType}
          setLikesCount={setLikesCount}
          is_repost={is_repost}
          original_post_id={original_post_id}
        />
      </div>
      <div className="flex-1" onClick={handleClickOnComment}>
        <IconText
          src={iconsData[1].src}
          width={iconsData[1].width}
          height={iconsData[1].height}
          alt={iconsData[1].alt}
          text={iconsData[1].text}
        />
      </div>
      <div className="flex-1" onClick={handleRepost}>
        <IconText
          src={iconsData[2].src}
          width={iconsData[2].width}
          height={iconsData[2].height}
          alt={iconsData[2].alt}
          text={iconsData[2].text}
        />
      </div>
      <div className="flex-1" onClick={handleClickOnComment}>
        <IconText
          src={iconsData[3].src}
          width={iconsData[3].width}
          height={iconsData[3].height}
          alt={iconsData[3].alt}
          text={iconsData[3].text}
        />
      </div>
    </div>
  );
};

export default PostFooterIconList;
