import CommentButton from "@/components/atom/CommentButton/CommentButton";
import CustomTextInput from "@/components/atom/CustomTextInput/CustomeTextInput";
import Icon from "@/components/atom/Icon/Icon";
import usePostCommentInput from "@/components/molecules/PostCommentInput/usePostCommentInput";
import EmojiPicker from "emoji-picker-react";

export default function PostCommentInput({ post_id }) {
  const {
    handleCommentSubmit,
    commentContent,
    setCommentContent,
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = usePostCommentInput(post_id);
  return (
    <div
      className={`flex justify-between text-sm ${
        commentContent !== "" ? " flex-col rounded-3xl " : "rounded-full"
      } border-[1px] mx-1 border-slate-300 relative`}
    >
      {showEmojiPicker && (
        <div className="absolute bottom-16 right-0" ref={emojiPickerRef}>
          <EmojiPicker
            height={400}
            onEmojiClick={(emojiObject) =>
              handleOnEmojiClick(emojiObject, setCommentContent)
            }
          />
        </div>
      )}

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
        {commentContent !== "" && (
          <div>
            <CommentButton onClick={handleCommentSubmit}>Comment</CommentButton>
          </div>
        )}
      </div>
    </div>
  );
}
