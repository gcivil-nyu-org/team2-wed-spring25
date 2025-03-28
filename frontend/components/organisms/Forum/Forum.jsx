"use client";
import useForum from "@/components/organisms/Forum/useForum";
import Loader from "@/components/molecules/Loader/Loader";
import UserData from "@/components/molecules/UserData/UserData";
import PostInput from "@/components/molecules/PostInput/PostInput";
import UserPosts from "@/components/organisms/Forum/UserPosts/UserPosts";

export default function Forums({ settingsType = "" }) {
  const {
    isLoading,
    isLoadingMore,
    isOpen,
    userPosts,
    handleClick,
    user,
    setUserPosts,
    hasMore,
    loaderRef,
    userHeading,
    isUserDataCardLoading,
    userSideCardData,
  } = useForum(settingsType);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-row justify-center items-start my-4`}>
      {!settingsType && (
        <div className="flex-col hidden  xsm:flex lg:w-2/6 xl:flex xl:flex-col xl:items-center max-w-[225px]">
          <UserData
            user={user}
            userHeading={userHeading}
            isUserDataCardLoading={isUserDataCardLoading}
            userSideCardData={userSideCardData}
          />
        </div>
      )}
      <div className="w-full lg:w-4/6 xl:2/5 flex flex-col md:mx-2 lg:mx-4 h-screen max-w-[555px]">
        {!settingsType && (
          <PostInput
            isOpen={isOpen}
            handleClick={handleClick}
            userPosts={userPosts}
            setUserPosts={setUserPosts}
            user={user}
          />
        )}
        <UserPosts
          userPosts={userPosts}
          setUserPosts={setUserPosts}
          hasMore={hasMore}
          loaderRef={loaderRef}
          isLoadingMore={isLoadingMore}
        />
      </div>
      {!settingsType && (
        <div className="bg-white rounded-sm h-1/2 hidden xlg:flex xlg:flex-col xlg:justify-center xlg:items-center w-[225px] max-w-[225px] max-h-[210px]">
          <h1>Recommendations</h1>
        </div>
      )}
    </div>
  );
}
