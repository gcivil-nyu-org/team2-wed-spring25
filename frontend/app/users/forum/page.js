"use client";

import ProtectedLayout from "@/app/custom-components/LayoutWrapper";
import Forums from "@/components/organisms/Forum/Forum";

export default function ForumPage() {
  return (
    <ProtectedLayout>
      <Forums />
    </ProtectedLayout>
  );
}
