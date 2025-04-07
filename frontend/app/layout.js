import "./globals.css";
import AuthProvider from "@/components/Auth/AuthProvider";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import ToastNotifications from "./custom-components/ToastComponent/ToastNotification";
import { Toaster } from "@/components/ui/sonner";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export const metadata = {
  title: "Nightwalkers",
  description:
    "Nightwalkers is a community-driven safety app for navigating New York City",
  icons: {
    icon: "/owl-logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> */}
      <body className={`antialiased bg-bglinkedin`}>
        <AuthProvider>
          <WebSocketProvider>
            {/* <WebSocketManager /> */}
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
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
