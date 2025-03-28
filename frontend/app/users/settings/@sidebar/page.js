import React from "react";
import Link from "next/link";
<<<<<<< HEAD
=======
import { Separator } from "@/components/ui/separator";
>>>>>>> origin/develop

const DefaultSidebar = () => {
  return (
    <>
      {/* General Settings Navigation */}
<<<<<<< HEAD
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
=======
      <nav className="flex flex-col w-full gap-2 text-center">
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Account
        </Link>
        <Link
          href="/users/settings/routes"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Route Management
        </Link>
        <Link
          href="/users/settings/forum"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Forum History
>>>>>>> origin/develop
        </Link>
      </nav>
    </>
  );
};

export default DefaultSidebar;
