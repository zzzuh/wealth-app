"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { input, buttonPrimary, errorText, label, formShell } from "@/lib/ui";
import { FREQUENCY_OPTIONS, frequencyLabel, prorateForPaycheck } from "@/lib/frequency";
import { formatCurrency } from "@/lib/format";

export default function CategoryForm({ payScheduleFrequency }: { payScheduleFrequency: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [allocationType, setAllocationType] = useState<"fixed" | "percentage">("fixed");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: Record<string, unknown> = { name, allocation_type: allocationType };
    if (allocationType === "fixed") {
      body.fixed_amount = amount;
      body.frequency = frequency || null;
    } else {
      body.percentage = amount;
    }

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
    setFrequency("");
    router.refresh();
  }

  const previewAmount =
    allocationType === "fixed" && frequency && payScheduleFrequency && amount
      ? prorateForPaycheck(Number(amount), frequency, payScheduleFrequency)
      : null;

  return (
    <form onSubmit={handleSubmit} className={formShell}>
      <div className="flex flex-col gap-1.5">
        <label className={label}>Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Groceries"
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Type</label>
        <select
          value={allocationType}
          onChange={(e) => setAllocationType(e.target.value as "fixed" | "percentage")}
          className={input}
        >
          <option value="fixed">Fixed $</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>{allocationType === "fixed" ? "Amount" : "Percent"}</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={allocationType === "fixed" ? "400.00" : "15"}
          className={`w-32 ${input}`}
        />
      </div>

      {allocationType === "fixed" && (
        <div className="flex flex-col gap-1.5">
          <label className={label}>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={input}>
            <option value="">Every paycheck</option>
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Adding..." : "Add category"}
      </button>

      {previewAmount != null && (
        <p className="w-full text-xs text-slate-400">
          ≈ {formatCurrency(previewAmount)} per {frequencyLabel(payScheduleFrequency).toLowerCase()} paycheck
        </p>
      )}

      {error && <p className={`w-full ${errorText}`}>{error}</p>}
    </form>
  );
}
