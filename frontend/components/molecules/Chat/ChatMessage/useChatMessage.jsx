import { useEffect, useRef, useState } from "react";

export default function useChatMessage(
  message,
  openSettingsId,
  setOpenSettingsId
) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const settingsRef = useRef(null);
  const isSettingsOpen = openSettingsId === message.id;

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

  return {
    currentUserId,
    isSettingsOpen,
    handleSettingsClick,
    settingsRef,
  };
}
