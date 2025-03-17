import React from "react";
import Link from "next/link";

const RoutesSidebar = () => {
  return (
    <>
      {/* Routes-specific Navigation */}
      <nav className="flex flex-col w-full">
        <Link
          href="/users/settings/routes"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Saved Routes
        </Link>
        <Link
          href="/users/settings/routes/preferences"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Route Preferences
        </Link>
        <Link
          href="/users/settings/routes/history"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Route History
        </Link>
      </nav>
    </>
  );
};

export default RoutesSidebar;
