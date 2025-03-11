'use client'
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/app/custom-components/AuthHook"
import { NotificationProvider} from "@/app/custom-components/ToastComponent/NotificationContext"
import TokenStorage from "@/utils/TokenStorage"
import { Toaster } from "@/components/ui/sonner"
import ToastNotifications from "../custom-components/ToastComponent/ToastNotification"

export default function AuthLayout({ children }) {
  return (
    <SessionProvider>
      <TokenStorage />
      <NotificationProvider>
        <AuthProvider>
          <ToastNotifications />
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: "my-toast",
              duration: 5000,
            }}
          />
        </AuthProvider>
      </NotificationProvider>
    </SessionProvider>
  )
}