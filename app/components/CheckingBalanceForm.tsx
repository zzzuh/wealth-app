"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { input, buttonPrimary, label } from "@/lib/ui";

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
      <div className="flex flex-col gap-1.5">
        <label className={label}>Update balance</label>
        <input
          required
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className={`w-32 ${input}`}
        />
      </div>
      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
