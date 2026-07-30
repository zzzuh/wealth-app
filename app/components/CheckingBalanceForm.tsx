"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckingBalanceForm() {
  const router = useRouter();
  const [balance, setBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/checking-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance }),
    });

    setSubmitting(false);
    setBalance("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Update balance</label>
        <input
          required
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
