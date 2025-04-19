import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/firebase";

export const requestNotificationPermission = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting notification permission", error);
    return null;
  }
};

export const listenToMessages = async (callback) => {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
