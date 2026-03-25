"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Freee Expenses
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/connect" className="text-muted-foreground hover:text-foreground transition-colors">
              Connections
            </Link>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
          </nav>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
