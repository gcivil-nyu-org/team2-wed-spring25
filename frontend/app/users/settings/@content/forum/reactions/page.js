import Forums from "@/components/organisms/Forum/Forum";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsForumReactionsPage() {
  return (
    <>
      <div className="h-full w-full overflow-y-scroll">
        <div className="lg:h-header h-mobileheader flex items-center ml-8">
          <Link href="/users/settings/forum">
            <ArrowLeft />
          </Link>
          <h1 className="text-lg md:text-xl lg:text-2xl m-8">
            <Link href="/users/settings">Settings</Link> &gt;
            <Link href="/users/settings/forum"> Forum</Link> &gt;
            <span className="italic"> Reactions</span>
          </h1>
        </div>
        <Separator orientation="horizontal" />
        <Forums settingsType={"reactions"} />
      </div>
    </>
  );
}
