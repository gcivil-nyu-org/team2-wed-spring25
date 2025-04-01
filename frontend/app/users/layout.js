'use client'
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext"
import { Toaster } from "@/components/ui/sonner"
import ToastNotifications from "../custom-components/ToastComponent/ToastNotification"
import { UserProvider } from "@/components/Auth/UserContextProvider"

export default function AuthLayout({ children }) {
  return (
    <UserProvider>
      <NotificationProvider>
        <ToastNotifications />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "my-toast",
            duration: 5000,
          }}
        />
      </NotificationProvider>
    </UserProvider>
  );
}
