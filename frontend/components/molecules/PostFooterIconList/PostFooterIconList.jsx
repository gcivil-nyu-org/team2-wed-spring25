import IconText from "@/components/molecules/IconText/IconText";
import LikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip";
import { iconsData } from "@/constants/icons";
import usePostFooterIconList from "./usePostFooterIconList";
const PostFooterIconList = ({
  handleClickOnComment,
  setLikesCount,
  setPosts,
  post,
}) => {
  const { userHasLiked, setUserHasLiked, likeType, setLikeType, handleRepost } =
    usePostFooterIconList(post, setPosts);

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
