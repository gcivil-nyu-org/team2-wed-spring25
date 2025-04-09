"use client";
import Forums from "@/components/organisms/Forum/Forum";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function ForumPage() {
  const { status } = useSession();
  const { initializeConnection, connectionStatus } = useWebSocket();

  useEffect(() => {
    if (typeof window === "undefined") return; // Server-side guard

    const checkAndConnect = () => {
      try {
        const userData = localStorage.getItem("user");
        console.log("User data from localStorage:", userData); // Debugging line
        console.log("User status:", status); // Debugging line

        if (userData) {
          const userId = JSON.parse(userData).id;
          console.log("User ID:", userId); // Debugging line

          // Only initialize if not already connected
          if (connectionStatus !== "connected") {
            console.log("Initializing WebSocket connection..."); // Debugging line

            initializeConnection(userId);
          }
        }
      } catch (error) {
        console.error("Connection initialization error:", error);
      }
    };

    checkAndConnect();
  }, []);

  return <Forums />;
}
