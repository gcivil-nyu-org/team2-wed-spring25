import React from "react";
import Link from "next/link";

const DefaultSidebar = () => {
  return (
    <>
      {/* General Settings Navigation */}
      <nav className="flex flex-col w-full text-center">
        <Link href="/users/settings" className="px-4 py-2 hover:bg-gray-100">
          Location Services
        </Link>
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Share Data
        </Link>
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Profile
        </Link>
        <Link
          href="/users/settings/routes"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Routes
        </Link>
      </nav>
    </>
  );
};

export default DefaultSidebar;
