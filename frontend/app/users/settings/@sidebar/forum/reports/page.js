import React from "react";
import Link from "next/link";

const ForumSidebar = () => {
  return (
    <>
      {/* Profile-specific Navigation */}
      <nav className="flex flex-col w-full gap-1.5 text-center">
        <Link
          href="/users/settings/forum/posts"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Posts
        </Link>
        <Link
          href="/users/settings/forum/comments"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Comments
        </Link>
        <Link
          href="/users/settings/forum/reactions"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Reactions
        </Link>
        <Link
          href="/users/settings/forum/reports"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Reported
        </Link>
        <Link
          href="/users/settings/forum/flagged_posts"
          className="px-4 py-2 hover:bg-gray-100"
        >
          Flagged Posts
        </Link>
      </nav>
    </>
  );
};

export default ForumSidebar;
