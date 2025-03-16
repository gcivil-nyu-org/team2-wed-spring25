import Button from "@/components/atom/Button/Button";
import UserImage from "@/components/atom/UserImage/UserImage";
import formatDateAgo from "@/utils/datetime";

export default function UserPostHeader({ user_avatar, user_fullname, date_created }) {
    return (
        <div className="flex flex-row px-4 pt-4">
            <UserImage 
                imageUrl={user_avatar} 
                width={50} 
                height={50}    
            />
            <div className="flex-1 flex-col justify-start items-start pl-3">
                <p className="text-lg font-medium leading-none">
                    {user_fullname}
                </p>
                <p className="text-sm font-thin text-gray-500 leading-none">
                    Kingslayer
                </p>
                <p className="text-sm font-thin top-10 text-gray-500 leading-none">
                    {formatDateAgo(date_created)}
                </p>
            </div>
            <div>
                <Button>+ Follow</Button>
            </div>
        </div>
    );
}