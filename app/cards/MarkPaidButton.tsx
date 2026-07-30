"use client";

import { useRouter } from "next/navigation";

export default function MarkPaidButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch(`/api/card-statements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true, paid_date: new Date().toISOString().slice(0, 10) }),
    });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="text-xs text-slate-500 hover:text-emerald-600">
      Mark paid
    </button>
  );
}
