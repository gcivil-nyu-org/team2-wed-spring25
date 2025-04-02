"use client";
import Forums from "@/components/organisms/Forum/Forum";

export default function ForumPage() {
  return (
    <ProtectedLayout>
      <Forums />
    </ProtectedLayout>
  );
}
