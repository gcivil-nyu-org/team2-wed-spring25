"use client";
import UserImage from "@/components/atom/UserImage/UserImage";
import formatDateAgo from "@/utils/datetime";
import { getUserFullName } from "@/utils/string";
import useUserPostHeader from "@/components/molecules/UserPost/UserPostHeader/useUserPostHeader";
import Icon from "@/components/atom/Icon/Icon";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";
import PostDialog from "@/components/organisms/PostDialog/PostDialog";

export default function UserPostHeader({
  user_avatar,
  user_fullname,
  date_created,
  post_user_id,
  is_following_author,
  user_karma,
  post_id,
  image_urls,
  content,
  is_repost,
  original_post_id,
}) {
  const {
    isFollowButtonDisabled,
    throttledHandleOnFollow,
    user_id,
    isPostOptionListVisible,
    setIsPostOptionListVisible,
    postOptionListRef,
    deletePostConfirmation,
    setDeletePostConfirmation,
    isDeleteInProgress,
    handleDeletePost,
    isPostDialogOpen,
    setIsPostDialogOpen,
  } = useUserPostHeader(post_user_id, post_id);
  return (
    <div className="flex flex-row px-4 pt-3">
      {
        <CustomDialogBox
          showDialog={deletePostConfirmation}
          dialogRef={postOptionListRef}
          onClickNo={() => {
            setDeletePostConfirmation(false);
          }}
          onClickYes={handleDeletePost}
          title="Delete Post"
          description={`Are you sure you want to delete this post. This action cannot be undone.`}
          disableYesButton={isDeleteInProgress} // Set to true or false based on your condition
        />
      }
      {isPostDialogOpen && (
        <PostDialog
          onClick={() => setIsPostDialogOpen(false)}
          is_edit={true}
          post_id={post_id}
          image_urls={image_urls}
          content={content}
          setIsPostDialogOpen={setIsPostDialogOpen}
          is_repost={is_repost}
          original_post_id={original_post_id}
        />
      )}
      {isPostOptionListVisible && (
        <div
          ref={postOptionListRef}
          className="absolute top-7 right-2 rounded-b-lg rounded-l-lg bg-white z-10 border-2 py-1 border-color-gray-200 shadow-md"
        >
          <ul>
            <li
              className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer"
              onClick={() => {
                setIsPostDialogOpen(true);
                setIsPostOptionListVisible(false);
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

            <li
              className="hover:bg-gray-100 flex gap-2 pl-4 pr-5 py-1 hover:cursor-pointer"
              onClick={() => {
                setDeletePostConfirmation(true);
                setIsPostOptionListVisible(false);
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
          </ul>
        </div>
      )}
      <UserImage imageUrl={user_avatar} width={48} height={48} />
      <div className="flex-1 flex-col justify-start pl-3 leading-none text-forum-subheading">
        <p className="text-md font-medium">
          {getUserFullName(user_fullname, "")}
        </p>
        <p className="text-xs font-normal text-forum-subheading2">
          Kingslayer • <span>⚡{user_karma} •</span>
        </p>
        <p className="text-xs font-normal text-forum-subheading2 leading-none">
          {formatDateAgo(date_created)}
        </p>
      </div>
      <div className="">
        <div className="relative">
          <div
            className={`flex items-start text-blue-500 font-semibold hover:bg-blue-100 ${
              !is_following_author ? "pt-2" : "py-2"
            } px-2 rounded-md hover:cursor-pointer hover:text-blue-800 relative -top-2`}
            onClick={() => {
              if (isFollowButtonDisabled) return;
              throttledHandleOnFollow(!is_following_author);
            }}
          >
            {user_id !== post_user_id &&
              (!is_following_author ? (
                <>
                  <p className="leading-none text-2xl font-bold relative -top-[5px]">
                    +
                  </p>
                  <p className="leading-none">Follow</p>
                </>
              ) : (
                <>
                  <p className="leading-none">Following</p>
                </>
              ))}
          </div>
          {user_id === post_user_id && (
            <div className="absolute top-0 right-0 rounded-full hover:cursor-pointer hover:bg-gray-100">
              <Icon
                src={"/icons/more-options.svg"}
                size={"md"}
                width={30}
                height={30}
                alt={"..."}
                onClick={() => {
                  setIsPostOptionListVisible(!isPostOptionListVisible);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
