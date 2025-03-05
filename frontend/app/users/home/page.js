'use client'
import { useAuth } from '@/app/custom-components/AuthHook';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
// This can be added to your navbar component
export function LogoutButton() {
  const { logout } = useAuth();


  // Test button to trigger an error
  return (
    <Button
      onClick={logout}
      variant="outline"
      className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
    >
      Logout
    </Button>
  );
}

// If you want to use it in your dashboard
export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { handleAuthError } = useAuth();
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-white/80">
            Logged in as: {user.email}
          </span>
        )}
        <Button
          onClick={logout}
          variant="outline"
          className="bg-white/10 hover:bg-white/20 border-white/20"
        >
          Logout
        </Button>
        <Button><Link href={`map/`}>Map Route</Link></Button>

        <button onClick={() => handleAuthError("API request failed", null, "api")}>
          Test Error Toast
        </button>
      </div>
    </div>
  );
}

// Usage in a page component
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Use the component */}
        <DashboardHeader />

        {/* Or directly use the logout function */}
        <div className="mt-8 text-center">
          <Button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600"
          >
            Sign Out
          </Button>
        </div>

        {/* Rest of your dashboard content */}
      </div>
    </div>
  );
}