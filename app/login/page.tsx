import type { Metadata } from "next";
import { DemoLogin } from "@/components/demo-login";

export const metadata: Metadata = {
  title: "Demo access | ClikWorks Account Research",
};

export default function LoginPage() {
  return <DemoLogin />;
}
