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
