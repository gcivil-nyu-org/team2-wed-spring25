<<<<<<< HEAD
import IconText from "@/components/molecules/IconText/IconText";
import LikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip";
import { iconsData } from "@/constants/icons";
import usePostFooterIconList from "./usePostFooterIconList";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useEffect } from "react";

const PostFooterIconList = ({
  handleClickOnComment,
  setShowReportUserDialog,
  setLikesCount,
  setPosts,
  post,
  isReported,
  setIsReported,
}) => {
  const { userHasLiked, setUserHasLiked, likeType, setLikeType, handleRepost } =
    usePostFooterIconList(post, setPosts);
  const { showError } = useNotification();
  useEffect(() => {
    setIsReported(post.is_reported);
  }, [post.is_reported, setIsReported]);
  return (
    <div className="flex flex-1 relative">
      <div className="flex-1 group">
        {/* like option list */}
        <LikeIconTextWithTooltip
          iconData={iconsData[0]}
          post_id={post.id}
          userHasLiked={userHasLiked}
          setUserHasLiked={setUserHasLiked}
          likeType={likeType}
          setLikeType={setLikeType}
          setLikesCount={setLikesCount}
          is_repost={post.is_repost}
          original_post_id={post.original_post_id}
        />
      </div>
      <div
        className="flex-1 flex justify-center items-center"
        onClick={handleClickOnComment}
      >
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
      <div
        className="flex-1"
        onClick={() => {
          if (post.is_reported) {
            showError("You have already reported this post");
            return;
          }
          setShowReportUserDialog(true);
        }}
      >
        <IconText
          src={iconsData[3].src}
          width={iconsData[3].width}
          height={iconsData[3].height}
          alt={iconsData[3].alt}
          text={isReported ? "Reported" : iconsData[3].text}
          theme={isReported ? "red" : null}
        />
      </div>
    </div>
  );
=======
import IconText from '@/components/molecules/IconText/IconText';
import LikeIconTextWithTooltip from '@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip';
const PostFooterIconList = ({handleClickOnComment}) => {
    const iconsData = [
        {
            src: "/icons/like.svg",
            width: 12,
            height: 12,
            alt: "Likes",
            text: "Likes",
        },
        {
            src: "/icons/comment.svg",
            width: 20,
            height: 20,
            alt: "Comments",
            text: "Comments",
        },
        {
            src: "/icons/repost.svg",
            width: 15,
            height: 15,
            alt: "Reposts",
            text: "Reposts",
        },
        {
            src: "/icons/send.svg",
            width: 12,
            height: 12,
            alt: "Send",
            text: "Send",
        },
    ];

    
    
    return (
        <div className='flex flex-1 relative'>
            <div className="flex-1 group">
                {/* like option list */}
                <LikeIconTextWithTooltip iconData={iconsData[0]} />
            </div>
            <div className='flex-1' onClick={handleClickOnComment}>
                <IconText
                    src={iconsData[1].src}
                    width={iconsData[1].width}
                    height={iconsData[1].height}
                    alt={iconsData[1].alt}
                    text={iconsData[1].text}
                    
                />
            </div>
            <div className='flex-1' onClick={handleClickOnComment}>
                <IconText
                    src={iconsData[2].src}
                    width={iconsData[2].width}
                    height={iconsData[2].height}
                    alt={iconsData[2].alt}
                    text={iconsData[2].text}
                />
            </div>
            <div className='flex-1' onClick={handleClickOnComment}>
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
>>>>>>> 9dc5cd8 (Complete UI for add comment input button, user post)
};

export default PostFooterIconList;
