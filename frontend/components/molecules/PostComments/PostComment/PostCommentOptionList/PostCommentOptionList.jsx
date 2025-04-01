import Icon from "@/components/atom/Icon/Icon";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";
import usePostCommentOptionList from "./usePostCommentOptionList";
import { deleteDark, editDark, ellipsisDark, reportDark } from "@/public/icons";

export default function PostCommentOptionList({
  isCommentOptionListVisible,
  setIsCommentOptionListVisible,
  setShowReportCategoryDialog,
  dropdownRef,
  parentComment,
  setComments,
  setCommentsCount,
  setIsEditCommentVisible,
}) {
  const {
    showDeleteCommentDialog,
    setShowDeleteCommentDialog,
    disableButtons,
    handleCommentDelete,
  } = usePostCommentOptionList(
    parentComment.post_id,
    parentComment.id,
    setComments,
    setCommentsCount
  );
  let user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="flex flex-col justify-start items-end relative bottom-1">
      <CustomDialogBox
        showDialog={showDeleteCommentDialog}
        dialogRef={null}
        onClickNo={() => {
          setShowDeleteCommentDialog(false);
        }}
        onClickYes={handleCommentDelete}
        title="Delete Comment"
        description={`Are you sure you want to delete comment. This action cannot be undone.`}
        disableYesButton={disableButtons}
      />

      <Icon
        src={ellipsisDark}
        size={"md"}
        width={20}
        height={20}
        alt={"..."}
        onClick={() =>
          setIsCommentOptionListVisible(!isCommentOptionListVisible)
        }
      />

      {isCommentOptionListVisible && (
        <div
          ref={dropdownRef}
          className="absolute top-7 right-2 rounded-b-lg rounded-l-lg bg-forum-post border-light z-10  py-1 shadow-md text-forum-heading"
        >
          <ul>
            {parentComment?.user?.id !== user.id && (
              <li
                className="hover:bg-forum-primary flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer justify-start items-center"
                onClick={() => {
                  setShowReportCategoryDialog(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={reportDark}
                  size={"md"}
                  width={18}
                  height={18}
                  alt={"Report"}
                ></Icon>
                <p>Report</p>
              </li>
            )}

            {parentComment?.user?.id === user.id && (
              <li
                className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer justify-start items-center"
                onClick={() => {
                  console.log(parentComment.id, "parentComment.id");
                  setIsEditCommentVisible(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={editDark}
                  size={"md"}
                  width={18}
                  height={18}
                  alt={"Edit"}
                ></Icon>
                <p>Edit</p>
              </li>
            )}

            {parentComment?.user?.id === user.id && (
              <li
                className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer justify-start items-center"
                onClick={() => {
                  setShowDeleteCommentDialog(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={deleteDark}
                  size={"md"}
                  width={18}
                  height={18}
                  alt={"Delete"}
                ></Icon>
                <p>Delete</p>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
