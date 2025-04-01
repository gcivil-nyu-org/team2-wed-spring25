"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SettingPanel from "@/app/custom-components/SettingPanel";
import { useUser } from "@/components/Auth/UserContextProvider";
// Dashboard header component
export function DashboardHeader() {
  const { user, isLoading } = useUser();

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">
            Logged in as: {isLoading ? "Loading..." : user?.email}
          </span>
          <Button asChild>
            <Link href={`forum/`}>Forum</Link>
          </Button>
          <Button asChild>
            <Link href={`map/`}>Map Route</Link>
          </Button>
          <SettingPanel />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <DashboardHeader />

        <div className="bg-white/10 rounded-lg p-4 mb-6">
          Maybe the forums based on location?
        </div>
      </div>
    </div>
  );
}
