import { getSession } from "@/lib/auth";
import NavLinks from "./NavLinks";
import SignOutButton from "./SignOutButton";

export default async function NavBar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="border-b border-slate-100">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold tracking-tight text-slate-900">Wealth</span>
          <NavLinks />
        </div>
        <SignOutButton />
      </nav>
    </header>
  );
}
