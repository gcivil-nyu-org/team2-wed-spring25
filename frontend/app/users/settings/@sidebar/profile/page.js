import React from "react";
import Link from "next/link";

const ProfileSidebar = () => {
  return (
    <>
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
      </nav>
    </>
  );
};

export default ProfileSidebar; 