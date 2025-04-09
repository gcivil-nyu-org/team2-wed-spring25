'use client'
import { UserProvider } from "@/components/Auth/UserContextProvider"
import SettingPanel from "@/app/custom-components/SettingPanel";

export default function AuthLayout({ children }) {
  return (
    <UserProvider>
        {children}  
      <SettingPanel />
    </UserProvider>
  );
}
