import React from "react";
import Link from "next/link";

const SafetyReportsSidebar = () => {
  return (
    <>
      {/* Routes-specific Navigation */}
      <nav className="flex flex-col w-full text-center">
        <Link
          href="/users/settings/safety-reports"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Safety Reports
        </Link>
      </nav>
    </>
  );
};

export default SafetyReportsSidebar;
