import { useChatStore } from "@/stores/useChatStore";

export default function useChatHeader(selectedUser) {
  const user = selectedUser.user;
  let isUserOnline = false;
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  onlineUsers.forEach((onlineUser) => {
    if (onlineUser.id == user.id) {
      isUserOnline = true;
    }
  });

  return { user, isUserOnline };
}
