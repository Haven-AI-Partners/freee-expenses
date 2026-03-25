import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freee Expenses",
  description: "Automated monthly expense submissions to Freee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
