export default function useChatHeader(selectedUser, onlineUsers) {
  const user = selectedUser.user;
  let isUserOnline = false;
  onlineUsers.forEach((onlineUser) => {
    if (onlineUser.id == user.id) {
      isUserOnline = true;
    }
  });

  return { user, isUserOnline };
}
