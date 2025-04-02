import Image from "next/image";
import useUserPostBody from "./useUserPostBody";

export default function UserPostBody({ content, image_urls }) {
  const { getPostContent, showDetailedView, setShowDetailedView } =
    useUserPostBody(content, 70);
  return (
    <>
      <div className="px-4 mt-2 text-forum-subheading">
        {getPostContent(content)}
      </div>
      {image_urls.length > 0 && image_urls[0] && (
        <div className="mt-2 h-[25rem]">
          <Image
            src={image_urls[0]}
            width={650}
            height={650}
            alt="Post Image"
            className="h-full w-full object-fill"
          />
        </div>
      )}
    </>
  );
}
