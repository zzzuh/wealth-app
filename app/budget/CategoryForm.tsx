"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [allocationType, setAllocationType] = useState<"fixed" | "percentage">("fixed");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: Record<string, unknown> = { name, allocation_type: allocationType };
    if (allocationType === "fixed") body.fixed_amount = amount;
    else body.percentage = amount;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add category");
      return;
    }

    setName("");
    setAmount("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Groceries"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Type</label>
        <select
          value={allocationType}
          onChange={(e) => setAllocationType(e.target.value as "fixed" | "percentage")}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="fixed">Fixed $</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">
          {allocationType === "fixed" ? "Amount" : "Percent"}
        </label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={allocationType === "fixed" ? "400.00" : "15"}
          className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add category"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
