import UserImage from "@/components/atom/UserImage/UserImage";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

export default function PostCommentUserImage({ avatar_url }) {
  return (
    <div className="flex flex-col justify-start">
      <UserImage
        imageUrl={avatar_url ?? fallbackUserProfileImage}
        width={32}
        height={32}
      />
    </div>
  );
}
