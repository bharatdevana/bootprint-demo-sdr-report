import { AccountBriefPage } from "@/components/account-brief-page";
import { specialtyBoxBrief } from "@/lib/account-brief-data";

export default function Home() {
  return <AccountBriefPage brief={specialtyBoxBrief} />;
}
