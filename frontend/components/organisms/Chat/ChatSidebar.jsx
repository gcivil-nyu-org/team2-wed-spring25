import UserImage from "@/components/atom/UserImage/UserImage";
import { getUserFullName } from "@/utils/string";

const ChatSidebar = ({ chatUserList, setSelectedUser, onlineUsers }) => {
  return (
    <section className="">
      <div>
        <h2 className="text-xl font-bold text-forum-heading mt-3 ml-3">
          Chat Users
        </h2>
      </div>
      <div>
        {chatUserList.map((chatUser) => {
          const user = chatUser.user;
          return (
            <div
              key={user.id}
              className="flex gap-2 hover:cursor-pointer"
              onClick={() => {
                setSelectedUser(chatUser);
              }}
            >
              <div>
                <UserImage imageUrl={user.avatar} width={50} height={50} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-forum-heading truncate">
                  {getUserFullName(user.first_name, user.last_name)}
                </h3>
                <p className="text-forum-subheading2 truncate">{user.email}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ChatSidebar;
