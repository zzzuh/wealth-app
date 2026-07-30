"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/budget", label: "Budget" },
  { href: "/paychecks", label: "Paychecks" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex gap-5">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              active ? "font-medium text-slate-900" : "text-slate-400 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
