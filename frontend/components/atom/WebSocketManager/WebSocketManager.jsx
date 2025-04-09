// components/WebSocketManager.jsx
"use client";
import { useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "next-auth/react";

export default function WebSocketManager() {
  const { initializeConnection, connectionStatus } = useWebSocket();
  const { status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return; // Server-side guard

    const checkAndConnect = () => {
      try {
        const userData = localStorage.getItem("user");
        console.log("User data from localStorage:", userData); // Debugging line

        if (userData && status === "authenticated") {
          const userId = JSON.parse(userData).id;
          console.log("User ID:", userId); // Debugging line

          // Only initialize if not already connected
          if (connectionStatus !== "connected") {
            initializeConnection(userId);
          }
        }
      } catch (error) {
        console.error("Connection initialization error:", error);
      }
    };

    // Check immediately
    checkAndConnect();

    // Also check when window gains focus (tab reactivation)
    window.addEventListener("focus", checkAndConnect);

    return () => {
      window.removeEventListener("focus", checkAndConnect);
    };
  }, [status, connectionStatus, initializeConnection]);

  return null;
}
