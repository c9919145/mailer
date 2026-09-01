"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", href: "/dashboard" },
  { title: "Contacts", href: "/contacts" },
  { title: "Lists", href: "/lists" },
  { title: "Templates", href: "/templates" },
  { title: "Campaigns", href: "/campaigns" },
  { title: "Analytics", href: "/analytics" },
  { title: "Domains", href: "/domains" },
  { title: "Webhooks", href: "/webhooks" },
  { title: "Settings", href: "/settings" },
];

export function MobileNav({ user }: { user: { name?: string | null } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col md:hidden">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">Mailer</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {open && (
        <nav className="border-b bg-card p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium",
                pathname.startsWith(item.href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
