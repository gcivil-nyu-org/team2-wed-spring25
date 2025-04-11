import { useChatStore } from "@/stores/useChatStore";
import { useRef, useState } from "react";

export default function useChatUser() {
  const [openSettingsId, setOpenSettingsId] = useState(null);
  const messagesContainerRef = useRef(null);
  const chatUserList = useChatStore((state) => state.chatUserList);
  const listOfUsersTyping = useChatStore((state) => state.listOfUsersTyping);
  const selectedUser = useChatStore((state) => state.selectedUser);
  return {
    openSettingsId,
    setOpenSettingsId,
    messagesContainerRef,
    chatUserList,
    listOfUsersTyping,
    selectedUser,
  };
}
