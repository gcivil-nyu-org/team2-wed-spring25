import { useEffect, useRef, useState } from "react";

export default function useChatUser() {
  const [openSettingsId, setOpenSettingsId] = useState(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.style.overflow = openSettingsId
        ? "hidden"
        : "auto";
    }
  }, [openSettingsId]);

  return {
    openSettingsId,
    setOpenSettingsId,
    messagesContainerRef,
  };
}
