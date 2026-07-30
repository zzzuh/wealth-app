"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayScheduleForm() {
  const router = useRouter();
  const [frequency, setFrequency] = useState("biweekly");
  const [netAmount, setNetAmount] = useState("");
  const [nextPayDate, setNextPayDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/pay-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequency, net_amount: netAmount, next_pay_date: nextPayDate }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add pay schedule");
      return;
    }

    setNetAmount("");
    setNextPayDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="semimonthly">Semimonthly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Net amount</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={netAmount}
          onChange={(e) => setNetAmount(e.target.value)}
          className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Next pay date</label>
        <input
          required
          type="date"
          value={nextPayDate}
          onChange={(e) => setNextPayDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save schedule"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
