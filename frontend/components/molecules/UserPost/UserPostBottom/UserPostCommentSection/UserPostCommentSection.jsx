<<<<<<< HEAD
import PostCommentInput from "@/components/molecules/PostCommentInput/PostCommentInput";
import PostComments from "@/components/molecules/PostComments/PostComments";
import useUserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useUserPostCommentSection";

export default function UserPostCommentSection({
  post_id,
  setCommentsCount,
  is_repost,
  original_post_id,
}) {
  const { comments, setComments } = useUserPostCommentSection();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <PostCommentInput
          post_id={post_id}
          setCommentsCount={setCommentsCount}
          setComments={setComments}
          is_repost={is_repost}
          original_post_id={original_post_id}
          is_reply={false}
          parent_comment_id={0}
          setRepliesCount={null}
        />
        <PostComments
          post_id={post_id}
          comments={comments}
          setComments={setComments}
          setCommentsCount={setCommentsCount}
          is_repost={is_repost}
          original_post_id={original_post_id}
          level={1}
        />
      </div>
    </div>
  );
}
=======
import Icon from "@/components/atom/Icon/Icon";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import EmojiPicker from "emoji-picker-react";
import { useCommentContent } from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useCommentContent";
import CommentButton from "@/components/atom/CommentButton/CommentButton";
import CustomTextInput from "@/components/atom/CustomTextInput/CustomeTextInput";

export default function UserPostCommentSection() {
    const {
            emojiPickerRef,
            showEmojiPicker,
            handleClickOnEmojiPicker,
            handleOnEmojiClick,
        } = useEmojiPicker();
    const {
            commentContent,
            setCommentContent,
        } = useCommentContent();
    

    return (
        <div className="flex flex-col">
            <div className="flex flex-col">
                <div className={`flex justify-between text-sm ${commentContent !== '' ? " flex-col rounded-3xl " : "rounded-full"} border-[1px] mx-1 border-slate-300 relative`}>
                    {
                        showEmojiPicker &&  <div className="absolute bottom-16 right-0" ref={emojiPickerRef}>
                                                <EmojiPicker height={400} onEmojiClick={(emojiObject) => handleOnEmojiClick(emojiObject, setCommentContent)}/>
                                            </div>
                    }
                    
                    <CustomTextInput 
                        content={commentContent}
                        setContent={setCommentContent}
                        placeholder={"Add a comment..."}
                    />
                    
                    <div className="flex justify-between">
                        <Icon
                            onClick={handleClickOnEmojiPicker}
                            src={"/icons/emoji.svg"}
                            width={20}
                            height={20}
                            alt="Image Picker"
                            size={"lg"}
                        />
                        {
                            commentContent !== "" 
                            && 
                            <div>
                                <CommentButton >
                                    Comment
                                </CommentButton>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
>>>>>>> 9dc5cd8 (Complete UI for add comment input button, user post)
