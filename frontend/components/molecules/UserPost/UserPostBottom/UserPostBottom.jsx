"use client";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import useUserPostBottom from "./useUserPostBottom";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";
import UserPostButtons from "./UserPostButtons/UserPostButtons";

export default function UserPostBottom({
  likesCount,
  commentsCount,
  setLikesCount,
  setCommentsCount,
  setPosts,
  post,
  disableYesButton,
}) {
  const {
    getCommentsCount,
    getLikesCount,
    showCommentSection,
    showReportUserDialog,
    setShowReportUserDialog,
    handleReportPost,
    handleClickOnComment,
    handleShowReportUserDialogRef,
    isReported,
    setIsReported,
  } = useUserPostBottom(post, setPosts);
  return (
    <div className="mx-3">
      <CustomDialogBox
        showDialog={showReportUserDialog}
        dialogRef={handleShowReportUserDialogRef}
        onClickNo={() => {
          setShowReportUserDialog(false);
        }}
        onClickYes={handleReportPost}
        title={"Report User"}
        description={
          "Are you sure you want to report this user? This action cannot be undone."
        }
        disableYesButton={disableYesButton}
      />
      <UserPostButtons
        likesCount={likesCount}
        commentsCount={commentsCount}
        getLikesCount={getLikesCount}
        getCommentsCount={getCommentsCount}
        setLikesCount={setLikesCount}
        setPosts={setPosts}
        post={post}
        handleClickOnComment={handleClickOnComment}
        setShowReportUserDialog={setShowReportUserDialog}
        isReported={isReported}
        setIsReported={setIsReported}
      />
      {showCommentSection && (
        <UserPostCommentSection
          post_id={post.id}
          setCommentsCount={setCommentsCount}
          is_repost={post.is_repost}
          original_post_id={post.is_repost ? post.original_post_id : null}
        />
      )}
    </div>
  );
}
