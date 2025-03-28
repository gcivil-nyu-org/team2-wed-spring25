import React from "react";
import Link from "next/link";

const ProfileSidebar = () => {
  return (
    <>
<<<<<<< HEAD
      {/* Profile-specific Navigation */}
      <nav className="flex flex-col w-full gap-1.5 text-center">
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Edit Photo
        </Link>
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Edit Name
        </Link>
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Edit Email
        </Link>
        <Link
          href="/users/settings/profile"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Change Password
        </Link>
=======
      {/* General Settings Navigation */}
      <nav className="flex flex-col w-full text-center">
        <Link
          href="/users/settings/profile#display"
          className="px-4 py-2 hover:bg-sidebar-border"
        >
          Change Display
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
>>>>>>> origin/develop
      </nav>
    </>
  );
};

<<<<<<< HEAD
export default ProfileSidebar; 
=======
export default ProfileSidebar;
>>>>>>> origin/develop
