"use client";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/app/custom-components/AuthHook";
import TokenStorage from "@/utils/TokenStorage";
import { Toaster } from "@/components/ui/sonner";
import AuthErrorSonner from "../custom-components/SonnerComponent";
import SettingPanel from "../custom-components/SettingPanel";

export default function AuthLayout({ children }) {
  return (
    <SessionProvider>
      <TokenStorage />
      <AuthProvider>
        <AuthErrorSonner />
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </SessionProvider>
  );
}
