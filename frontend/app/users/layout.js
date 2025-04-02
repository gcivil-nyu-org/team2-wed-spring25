'use client'
import { UserProvider } from "@/components/Auth/UserContextProvider"

export default function AuthLayout({ children }) {
  return (
    <UserProvider>
        {children}        
    </UserProvider>
  );
}
