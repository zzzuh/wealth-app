import Link from "next/link";
import { getSession } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/budget", label: "Budget" },
  { href: "/paychecks", label: "Paychecks" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
];

export default async function NavBar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-900">Wealth</span>
          <div className="flex gap-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <SignOutButton />
      </nav>
    </header>
  );
}
