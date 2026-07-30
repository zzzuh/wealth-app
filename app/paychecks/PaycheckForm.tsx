"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { input, buttonPrimary, errorText, label, formShell } from "@/lib/ui";

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
    <form onSubmit={handleSubmit} className={formShell}>
      <div className="flex flex-col gap-1.5">
        <label className={label}>Pay schedule</label>
        <select
          value={payScheduleId}
          onChange={(e) => {
            const id = e.target.value;
            setPayScheduleId(id);
            const match = paySchedules.find((s) => s.id === id);
            if (match) setNetAmount(match.net_amount);
          }}
          className={input}
        >
          <option value="">None</option>
          {paySchedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.frequency}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Pay date</label>
        <input
          required
          type="date"
          value={payDate}
          onChange={(e) => setPayDate(e.target.value)}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Net amount</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={netAmount}
          onChange={(e) => setNetAmount(e.target.value)}
          className={`w-32 ${input}`}
        />
      </div>

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Adding..." : "Record paycheck"}
      </button>

      {error && <p className={`w-full ${errorText}`}>{error}</p>}
    </form>
  );
}
