"use client";
import Icon from "@/components/atom/Icon/Icon";
import { getUserFullName } from "@/utils/string";
import usePostComment from "@/components/molecules/PostComments/PostComment/usePostComment";
import PostCommentInput from "@/components/molecules/PostCommentInput/PostCommentInput";
import PostComments from "@/components/molecules/PostComments/PostComments";
import reportCategories from "@/constants/reportCategories";
import ReportDialog from "@/components/organisms/ReportDialog/ReportDialog";
import PostCommentUserImage from "./PostCommentUserImage/PostCommentUserImage";
import PostCommentUserBody from "./PostCommentUserBody/PostCommentUserBody";
import PostCommentOptionList from "./PostCommentOptionList/PostCommentOptionList";

export default function PostComment({
  parentComment,
  post_id,
  original_post_id,
  is_repost,
  level = 1,
  setComments,
  setCommentsCount,
}) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLikeComment,
    likesCount,
    repliesCount,
    userHasLiked,
    likeType,
    showCommentReply,
    setShowCommentReply,
    showCommentReplyInput,
    setShowCommentReplyInput,
    replies,
    setReplies,
    setRepliesCount,
    isCommentOptionListVisible,
    setIsCommentOptionListVisible,
    showReportCategoryDialog,
    setShowReportCategoryDialog,
    reportCategorySelectedIndex,
    setReportCategorySelectedIndex,
    dropdownRef,
    reportCategoryDialogRef,
    handleReportComment,
    isReportedCommentLoading,
    isEditCommentVisible,
    setIsEditCommentVisible,
  } = usePostComment(parentComment, post_id, original_post_id, is_repost);

  const userFullName = getUserFullName(
    parentComment?.user?.first_name || "Unknown",
    parentComment?.user?.last_name || "Unknown"
  );
  const reportedCategoryNotSelected =
    "border-gray-300 text-gray-600 hover:border-transparent hover:shadow-[0_0_0_2px_rgba(156,163,175,1)] hover:bg-gray-100";
  const reportedCategorySelected =
    "border-green-700 text-white bg-green-700 hover:bg-green-900";
  return (
    <div className={`flex mb-0 flex-col`}>
      {showReportCategoryDialog && (
        <ReportDialog
          reportCategories={reportCategories}
          reportCategorySelectedIndex={reportCategorySelectedIndex}
          setReportCategorySelectedIndex={setReportCategorySelectedIndex}
          setShowReportCategoryDialog={setShowReportCategoryDialog}
          handleReportComment={handleReportComment}
          isReportedCommentLoading={isReportedCommentLoading}
          ref={reportCategoryDialogRef}
          reportedCategoryNotSelected={reportedCategoryNotSelected}
          reportedCategorySelected={reportedCategorySelected}
        />
      )}
      <div className="flex flex-1">
        <PostCommentUserImage avatar_url={parentComment.user.avatar_url} />
        <PostCommentUserBody
          parentComment={parentComment}
          userFullName={userFullName}
          likesCount={likesCount}
          repliesCount={repliesCount}
          userHasLiked={userHasLiked}
          likeType={likeType}
          isTooltipVisible={isTooltipVisible}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          throttledHandleOnLikeComment={throttledHandleOnLikeComment}
          setShowCommentReplyInput={setShowCommentReplyInput}
          showCommentReplyInput={showCommentReplyInput}
          setShowCommentReply={setShowCommentReply}
          showCommentReply={showCommentReply}
          isEditCommentVisible={isEditCommentVisible}
          setIsEditCommentVisible={setIsEditCommentVisible}
          setComments={setComments}
          setCommentsCount={setCommentsCount}
        />
        <PostCommentOptionList
          isCommentOptionListVisible={isCommentOptionListVisible}
          setIsCommentOptionListVisible={setIsCommentOptionListVisible}
          setShowReportCategoryDialog={setShowReportCategoryDialog}
          dropdownRef={dropdownRef}
          parentComment={parentComment}
          setComments={setComments}
          setCommentsCount={setCommentsCount}
          setIsEditCommentVisible={setIsEditCommentVisible}
        />
      </div>
      <div className={`ml-${level >= 3 ? 0 : 8} mt-2`}>
        {showCommentReplyInput && (
          <PostCommentInput
            post_id={post_id}
            setCommentsCount={setCommentsCount}
            setComments={setReplies}
            is_repost={parentComment.is_repost}
            original_post_id={original_post_id}
            is_reply={true}
            parent_comment_id={parentComment.id}
            setRepliesCount={setRepliesCount}
          />
        )}
        {showCommentReply && (
          <PostComments
            parentComment={parentComment}
            key={parentComment.id}
            post_id={post_id}
            original_post_id={original_post_id}
            is_reply={true}
            parent_comment_id={parentComment.id}
            comments={replies}
            setComments={setReplies}
            setCommentsCount={setCommentsCount}
            is_repost={is_repost}
            level={level + 1}
          />
        )}
      </div>
    </div>
  );
}
