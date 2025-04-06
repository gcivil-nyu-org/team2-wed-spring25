import { useEffect, useState } from "react";

export default function useChatMessage() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Only access localStorage after component mounts (client-side)
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user"))
        : null;
    setCurrentUserId(user?.id || null);
  }, []);

  return { currentUserId };
}
