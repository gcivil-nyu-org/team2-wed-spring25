"use client";
import { useEffect, useState } from "react";
import { fetchToken, setupForegroundListener } from "@/firebase";
import { toast } from "react-toastify";
import { usePathname, useRouter } from "next/navigation";

const useNotifications = () => {
  // Inside your component
  const [activeToast, setActiveToast] = useState(null);
  const pathName = usePathname();
  const router = useRouter();
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Register service worker and get token
        const token = await fetchToken();
        if (!token) {
          console.error("No FCM token found. Notifications may not work.");
          return;
        }
        if (token) {
          // Send token to Django backend
          await registerToken(token);
          console.log("FCM Token registered:", token);
        }

        // Set up foreground listener
        await setupForegroundListener((payload) => {
          console.log("Notification received in foreground:", payload);
          let data = null;
          if (payload.data) {
            data = payload.data;
          } else {
            data = payload.notification;
          }

          if (data.title === "New message" && pathName === "/users/chat") {
            return;
          }
          const handleClick = () => {
            if (activeToast) {
              toast.dismiss(activeToast);
            }
            if (data.title === "New message") {
              if (pathName === "/users/chat") {
                return;
              }

              router.push("/users/chat");
            }
          };
          const toastId = toast.info(
            <div onClick={handleClick}>
              <h3 className="font-bold">{data.title}</h3>
              <p className="text-sm">{data.body}</p>
            </div>,
            {
              hideProgressBar: true,
              theme: "dark",
              autoClose: 2000,
            }
          );
          setActiveToast(toastId);
        });
      } catch (error) {
        console.error("Notification initialization error:", error);
      }
    };

    initializeNotifications();
  }, []);
};

const registerToken = async (token) => {
  try {
    localStorage.setItem("fcm_token", token);
  } catch (error) {
    console.error("Error registering token:", error);
  }
};

export default useNotifications;
