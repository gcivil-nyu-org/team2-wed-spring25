"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/app/custom-components/AuthHook";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import SettingPanel from "@/app/custom-components/SettingPanel";

// Dashboard header component
export function DashboardHeader() {
  const { user } = useAuth();
  const { showError, showWarning } = useNotification();
  const testToast = () => {
    showWarning(
      "Your location is outside NYC. Using Washington Square Park as default. SafeRouteNYC only supports navigation within New York City.",
      null,
      "location_outside_nyc"
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-white/80">
              Logged in as: {user.email}
            </span>
          )}
          <Button asChild>
            <Link href={`home/`}>Home</Link>
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
  const { user } = useAuth();

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
