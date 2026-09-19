import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClikWorks Account Qualification",
  description: "A private SDR account qualification brief generated from a company website.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
