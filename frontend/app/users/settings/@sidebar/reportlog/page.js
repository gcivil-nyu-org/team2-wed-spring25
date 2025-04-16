import React from "react";
import Link from "next/link";

const ReportsSidebar = () => {
  return (
    <>
      {/* Routes-specific Navigation */}
      <nav className="flex flex-col w-full text-center">
        <Link
          href="/users/settings/reportlog"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Reports
        </Link>
        {/* <Link
          href="/users/settings/routes/preferences"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Route Preferences
        </Link>
        <Link
          href="/users/settings/routes/history"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Route History
        </Link> */}
      </nav>
    </>
  );
};

export default ReportsSidebar;
