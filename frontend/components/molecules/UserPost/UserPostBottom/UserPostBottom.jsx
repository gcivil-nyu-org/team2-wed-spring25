import UserImage from "@/components/atom/UserImage/UserImage";
import IconList from "@/components/molecules/IconList/IconList";

export default function UserPostBottom({ user_avatar }) {
    return (
        <div className="flex justify-between mx-3">
            <div className="flex flex-row justify-center items-center px-4 rounded-md hover:bg-slate-100 my-2">
                <UserImage
                    imageUrl={user_avatar}
                    width={30}
                    height={30}
                />
            </div>

            <IconList />
        </div>
    );
}