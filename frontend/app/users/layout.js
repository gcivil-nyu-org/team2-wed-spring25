'use client'
import { usePathname } from 'next/navigation';
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/app/custom-components/AuthHook"
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext"
import TokenStorage from "@/utils/TokenStorage"
import { Toaster } from "@/components/ui/sonner"
import ToastNotifications from "../custom-components/ToastComponent/ToastNotification"
import SettingPanel from "../custom-components/SettingPanel"

export default function AuthLayout({ children }) {
  const pathname = usePathname(); // ✅ get current path
  const showBottomNav = !pathname.includes('/login') && !pathname.includes('/register');

  return (
    <SessionProvider>
      <TokenStorage />
      <NotificationProvider>
        <AuthProvider>
          <ToastNotifications />

          {showBottomNav && <SettingPanel />}

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
  );
}
