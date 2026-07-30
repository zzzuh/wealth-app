"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PaySchedule {
  id: string;
  frequency: string;
  net_amount: string;
}

export default function PaycheckForm({ paySchedules }: { paySchedules: PaySchedule[] }) {
  const router = useRouter();
  const [payScheduleId, setPayScheduleId] = useState("");
  const [payDate, setPayDate] = useState("");
  const [netAmount, setNetAmount] = useState(paySchedules[0]?.net_amount ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/paychecks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pay_schedule_id: payScheduleId || null,
        pay_date: payDate,
        net_amount: netAmount,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add paycheck");
      return;
    }

    setPayDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Pay schedule</label>
        <select
          value={payScheduleId}
          onChange={(e) => {
            const id = e.target.value;
            setPayScheduleId(id);
            const match = paySchedules.find((s) => s.id === id);
            if (match) setNetAmount(match.net_amount);
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">None</option>
          {paySchedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.frequency}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Pay date</label>
        <input
          required
          type="date"
          value={payDate}
          onChange={(e) => setPayDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
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

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Record paycheck"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
