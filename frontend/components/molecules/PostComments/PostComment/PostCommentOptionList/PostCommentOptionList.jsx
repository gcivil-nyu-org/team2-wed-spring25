import Icon from "@/components/atom/Icon/Icon";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";
import usePostCommentOptionList from "./usePostCommentOptionList";

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
        src={"/icons/more-options.svg"}
        size={"md"}
        width={30}
        height={30}
        alt={"..."}
        onClick={() =>
          setIsCommentOptionListVisible(!isCommentOptionListVisible)
        }
      />

      {isCommentOptionListVisible && (
        <div
          ref={dropdownRef}
          className="absolute top-7 right-2 rounded-b-lg rounded-l-lg bg-white z-10 border-2 py-1 border-color-gray-200 shadow-md"
        >
          <ul>
            {parentComment?.user?.id !== user.id && (
              <li
                className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer"
                onClick={() => {
                  setShowReportCategoryDialog(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={"/icons/report.png"}
                  size={"md"}
                  width={13}
                  height={13}
                  alt={"Report"}
                ></Icon>
                <p>Report</p>
              </li>
            )}

            {parentComment?.user?.id === user.id && (
              <li
                className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer"
                onClick={() => {
                  console.log(parentComment.id, "parentComment.id");
                  setIsEditCommentVisible(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={"/icons/pencil.png"}
                  size={"md"}
                  width={13}
                  height={13}
                  alt={"Edit"}
                ></Icon>
                <p>Edit</p>
              </li>
            )}

            {parentComment?.user?.id === user.id && (
              <li
                className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer"
                onClick={() => {
                  setShowDeleteCommentDialog(true);
                  setIsCommentOptionListVisible(false);
                }}
              >
                <Icon
                  src={"/icons/delete.png"}
                  size={"md"}
                  width={13}
                  height={13}
                  alt={"Report"}
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
