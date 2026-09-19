import { AccountBriefPage } from "@/components/account-brief-page";
import { joshPackagingBrief } from "@/lib/account-brief-data";

export default function JoshPackagingPage() {
  return <AccountBriefPage brief={joshPackagingBrief} />;
}
