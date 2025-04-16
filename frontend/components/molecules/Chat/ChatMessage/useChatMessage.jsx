import { apiPost } from "@/utils/fetch/fetch";
import { useEffect, useRef, useState } from "react";

export default function useChatMessage(
  message,
  openSettingsId,
  setOpenSettingsId,
  setChatUserList,
  selectedUser
) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const settingsRef = useRef(null);
  const isSettingsOpen = openSettingsId === message.id;

  const handleCopy = async () => {
    try {
      console.log(message);

      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.log("Error copying message:", error);

      showError("Failed", "Failed to copy message", "copy_message_error");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleteDialogOpen(true);
      console.log("Deleting message:", message.id);
    } catch (error) {
      console.log("Error deleting message:", error);

      showError("Failed", "Failed to delete message", "delete_message_error");
    } finally {
      // setIsDeleteDialogOpen(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsEditDialogOpen(true);
    } catch (error) {
      console.log("Error editing message:", error);

      showError("Failed", "Failed to edit message", "edit_message_error");
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  useEffect(() => {
    // Only access localStorage after component mounts (client-side)
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user"))
        : null;
    setCurrentUserId(user?.id || null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSettingsOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(e.target)
      ) {
        setOpenSettingsId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen, setOpenSettingsId, settingsRef]);

  const handleSettingsClick = () => {
    console.log("message settings clicked: ", message);

    setOpenSettingsId(isSettingsOpen ? null : message.id);
  };

  const deleteMessage = async (type) => {
    try {
      await apiPost(`/chats/chat/${message.id}/delete/`, {
        delete_type: type,
      });
      setChatUserList((prevList) => {
        return prevList.map((user) => {
          if (user.user.id === selectedUser.user.id) {
            return {
              ...user,
              messages: user.messages.map((msg) => {
                if (msg.id === message.id) {
                  return { ...msg, is_deleted: type };
                }
                return msg;
              }),
            };
          }
          return user;
        });
      });
    } catch {
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return {
    currentUserId,
    isSettingsOpen,
    handleSettingsClick,
    settingsRef,
    handleCopy,
    handleDelete,
    handleEdit,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteMessage,
  };
}
