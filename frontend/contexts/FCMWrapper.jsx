// components/NotificationsWrapper.tsx
"use client";

import useNotifications from "@/hooks/useNotifications";

export default function FCMWrapper() {
  useNotifications();
  return null; // This component doesn't render anything
}
