import { useEffect, useState } from "react";

export const NotificationToast = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleNotification = (event) => {
      setNotification(event.detail);
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener("fcm-notification", handleNotification);
    return () => {
      window.removeEventListener("fcm-notification", handleNotification);
    };
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg max-w-xs z-50 border border-gray-200">
      <h4 className="font-bold text-gray-800">
        {notification.notification?.title || "New Notification"}
      </h4>
      <p className="text-sm text-gray-600 mt-1">
        {notification.notification?.body}
      </p>
      <button
        onClick={() => setNotification(null)}
        className="mt-2 text-xs text-blue-500 hover:text-blue-700"
      >
        Dismiss
      </button>
    </div>
  );
};
