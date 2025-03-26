import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const DefaultSidebar = () => {
  return (
    <>
      {/* General Settings Navigation */}
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
        </Link>
      </nav>
    </>
  );
};

export default DefaultSidebar;
