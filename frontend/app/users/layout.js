'use client'
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/app/custom-components/AuthHook"
import TokenStorage from "@/utils/TokenStorage"
export default function AuthLayout({ children }) {
  return (
    <SessionProvider>
      <TokenStorage />
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}