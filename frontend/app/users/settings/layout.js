"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";

const SettingsLayout = ({ children, sidebar, content }) => {
  return (
    <div className="flex flex-row font-mono h-screen w-full bg-sidebar-group text-sidebar-text">
      <div className="flex flex-col justify-start items-center h-full w-[15%] gap-8">
        <div className="flex flex-col items-center h-[15%] mt-2 w-full">
          <Link href="/users/home" className="flex flex-col items-center gap-2">
            <Image
              className="mx-auto lg:mx-0 h-auto"
              src="/owl-logo.svg"
              width={64}
              height={64}
              alt="Nightwalkers Logo"
            />
            <span>Nightwalkers</span>
          </Link>
        </div>
        {sidebar}
      </div>
      <Separator orientation="vertical" />
      {content || children}
    </div>
  );
};

export default SettingsLayout;
