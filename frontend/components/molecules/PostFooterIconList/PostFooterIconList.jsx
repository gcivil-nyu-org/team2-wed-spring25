import IconText from "@/components/molecules/IconText/IconText";
import LikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip";
const PostFooterIconList = ({
  handleClickOnComment,
  post_id,
  user_has_liked,
  like_type,
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

  return (
    <div className="flex flex-1 relative">
      <div className="flex-1 group">
        {/* like option list */}
        <LikeIconTextWithTooltip
          iconData={iconsData[0]}
          post_id={post_id}
          user_has_liked={user_has_liked}
          like_type={like_type}
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
      <div className="flex-1" onClick={handleClickOnComment}>
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
