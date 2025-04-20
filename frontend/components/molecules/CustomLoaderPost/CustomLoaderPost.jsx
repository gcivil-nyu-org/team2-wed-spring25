import React from "react";
import Loader from "../Loader/Loader";
import UserPostHeader from "../UserPost/UserPostHeader/UserPostHeader";
import UserImage from "@/components/atom/UserImage/UserImage";

const CustomLoaderPost = () => {
  return (
    <div className="flex flex-col rounded-lg w-full font-sans mb-2 bg-bg-post border-dark relative animate-pulse">
      <div className="flex flex-row px-4 pt-3">
        <div className="w-12 h-12 bg-gray-600 rounded-full" />
        <div className="flex-1 flex-col justify-start pl-3 leading-none text-forum-subheading">
          <div className="h-5 w-1/4 bg-gray-600 rounded"></div>
          <div className="h-3 w-1/6 bg-gray-600 rounded mt-1"></div>
          <div className="h-3 w-1/6 bg-gray-600 rounded mt-1"></div>
        </div>
        <div className="w-24 h-8 bg-gray-600 rounded"></div>
      </div>

      <div className=" h-48 bg-gray-600 rounded mt-4 mx-2"></div>
      <div className=" h-12 bg-gray-600 rounded m-2"></div>
    </div>
  );
};

export default CustomLoaderPost;
