import React from "react";
import Link from "next/link";

const ProfileSidebar = () => {
  return (
    <>
      {/* General Settings Navigation */}
      <nav className="flex flex-col w-full text-center">
        <Link
          href="/users/settings/profile#display"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Profile Photo
        </Link>
        <Link
          href="/users/settings/profile#profile"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Profile Information
        </Link>
        <Link
          href="/users/settings/profile#password"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Change Password
        </Link>
        <Link
          href="/users/settings/profile#locationsettings"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Enable Location
        </Link>
        <Link
          href="/users/settings/profile#privacy"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Privacy
        </Link>
        <Link
          href="/users/settings/profile#report"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Report a Bug
        </Link>
        <Link
          href="/users/settings/profile#flagged_posts"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          My Reports
        </Link>
      </nav>
    </>
  );
};

export default ProfileSidebar;
