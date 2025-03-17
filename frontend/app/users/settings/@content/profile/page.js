import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const ProfileContent = () => {
  return (
    <div className="h-full w-full">
      <div className="h-[15%] flex items-center">
        <h1 className="text-2xl text-gray-800 m-6">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Profile</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="p-6">
        {/* Profile-specific content */}
        <div className="space-y-6">
          <h2>Profile</h2>
          <form className="space-y-4">
            <div>
              <label>Name</label>
              <input type="text" className="border rounded p-2" />
            </div>
            <div>
              <label>Email</label>
              <input type="email" className="border rounded p-2" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
