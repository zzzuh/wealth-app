"use client";

import { useRouter } from "next/navigation";
import { link } from "@/lib/ui";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className={link}>
      Sign out
    </button>
  );
}
