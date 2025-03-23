import CommentButton from "@/components/atom/CommentButton/CommentButton";
import CustomTextInput from "@/components/atom/CustomTextInput/CustomeTextInput";
import Icon from "@/components/atom/Icon/Icon";
import usePostCommentInput from "@/components/molecules/PostCommentInput/usePostCommentInput";
import EmojiPicker from "emoji-picker-react";

export default function PostCommentInput({
  post_id,
  setCommentsCount,
  setComments,
  is_repost,
  original_post_id,
  is_reply = true,
  parent_comment_id = null,
  setRepliesCount = null,
  initialContent = "",
  isEdit = false,
  setIsInputVisible = null,
}) {
  console.log("setComments from PostCommentInput", setComments);

  const {
    handleCommentSubmit,
    commentContent,
    setCommentContent,
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
    isButtonDisabled,
    isLoading,
  } = usePostCommentInput(
    post_id,
    setCommentsCount,
    setComments,
    is_repost,
    original_post_id,
    is_reply,
    parent_comment_id,
    setRepliesCount,
    initialContent,
    isEdit,
    setIsInputVisible
  );
  return (
    <div
      className={`flex justify-between text-sm ${
        commentContent !== "" ? " flex-col rounded-3xl " : "rounded-full"
      } border-[1px] mx-1 mb-4 border-slate-300 relative`}
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
        isLoading={isLoading}
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
            <CommentButton
              onClick={handleCommentSubmit}
              disabled={isButtonDisabled || isLoading} // Disable during API call or loading
              aria-disabled={isButtonDisabled || isLoading} // Accessibility
            >
              {isEdit && isLoading ? "Editing..." : ""}
              {isEdit && !isLoading ? "Edit" : ""}
              {!isEdit ? (isLoading ? "Submitting..." : "Comment") : ""}
            </CommentButton>
            {isEdit && (
              <CommentButton
                theme={"red"}
                onClick={() => {
                  setIsInputVisible(false);
                  setCommentContent("");
                }}
              >
                Cancel
              </CommentButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
