"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

const DynamicMap = dynamic(
  () => import("@/components/ui/Map"),
  {
    ssr: false,
    loading: () => <Loading />  
  }
);

export default function Home() {
  return (
    <main>
      <DynamicMap />
    </main>
  );
}
