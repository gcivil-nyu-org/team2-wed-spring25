// app/layout.js
'use client';

import "./globals.css";
import { usePathname } from "next/navigation"; 
import AuthProvider from "@/components/Auth/AuthProvider";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import ToastNotifications from "./custom-components/ToastComponent/ToastNotification";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import BottomNavBar from "@/components/organisms/BottomNavBar/BottomNavBar";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Hide nav and sidebar on login/register pages and settings
  const hideNav = pathname === "/" || pathname.startsWith("/login") 
                || pathname.startsWith("/register") || pathname.startsWith("/users/settings");

  return (
    <html lang="en">
      <body className="antialiased bg-bglinkedin overflow-x-hidden">
        <AuthProvider>
          <SidebarProvider>
            <NotificationProvider>
              <ToastNotifications />
              {children}
              {!hideNav && <SettingsSidebar />}
              {!hideNav && <BottomNavBar />}
              <Toaster
                position="top-right"
                toastOptions={{
                  className: "my-toast",
                  duration: 5000,
                }}
              />
            </NotificationProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
