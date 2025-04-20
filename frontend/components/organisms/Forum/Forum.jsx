"use client";
import useForum from "@/components/organisms/Forum/useForum";
import Loader from "@/components/molecules/Loader/Loader";
import UserData from "@/components/molecules/UserData/UserData";
import PostInput from "@/components/molecules/PostInput/PostInput";
import UserPosts from "@/components/organisms/Forum/UserPosts/UserPosts";
import CustomLoaderPost from "@/components/molecules/CustomLoaderPost/CustomLoaderPost";
import ForumSidebarInfo from "@/components/organisms/Forum/ForumSidebarInfo";
import { useState, useEffect } from "react";

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-close drawer if screen is resized to desktop
      if (window.innerWidth >= 768 && drawerOpen) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawerOpen]);

  return (
    <div
      className={`relative w-full flex flex-row justify-center items-start py-4 ${
        settingsType ? "bg-sidebar-bg" : "bg-bg-forum"
      }`}
    >
      {/* Left column: profile card (desktop only) */}
      {!settingsType && (
        <div className="flex-col hidden xsm:flex lg:w-2/6 xl:flex xl:flex-col xl:items-center max-w-[225px]">
          <UserData
            isLoading={isLoading}
            user={user}
            userHeading={userHeading}
            isUserDataCardLoading={isUserDataCardLoading}
            userSideCardData={userSideCardData}
          />
        </div>
      )}

      {/* Center: posts */}
      <div className="w-full lg:w-4/6 xl:2/5 flex flex-col md:mx-2 lg:mx-4 min-h-screen max-w-[555px]">
        {!settingsType && (
          <PostInput
            isOpen={isOpen}
            handleClick={handleClick}
            userPosts={userPosts}
            setUserPosts={setUserPosts}
            user={user}
          />
        )}
        {!isLoading && (
          <UserPosts
            userPosts={userPosts}
            setUserPosts={setUserPosts}
            hasMore={hasMore}
            loaderRef={loaderRef}
            isLoadingMore={isLoadingMore}
          />
        )}
        <div
          ref={loaderRef}
          className={`flex justify-start items-start h-[50vh] ${
            hasMore ? "visible" : "hidden"
          }`}
        >
          <CustomLoaderPost />
        </div>
        {!hasMore && (
          <p className="text-center text-forum-heading2 text-lg mt-8 mb-10">
            No more posts to show
          </p>
        )}
      </div>

      {/* Right sidebar (desktop only) */}
      {!settingsType && (
        <div className="hidden md:flex">
          <ForumSidebarInfo />
        </div>
      )}

      {/* Floating Info Button (mobile only) */}
      {!settingsType && windowWidth < 768 && (
        <>
          <button
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-20 right-4 z-50 bg-gray-800 text-white rounded-full px-4 py-2 text-sm shadow-md hover:bg-gray-700 transition"
          >
            ℹ️ Info
          </button>

          {/* Bottom Drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-end">
              <div className="relative w-[75%] max-w-sm h-[75dvh] bg-[#1e1e1e] rounded-t-2xl shadow-xl overflow-hidden">
                {/* Sticky header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 sticky top-0 bg-[#1e1e1e] z-10">
                  <h2 className="font-semibold text-white text-sm">Forum Info</h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto h-[calc(50dvh)] px-4 pb-6">
                  <ForumSidebarInfo />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
