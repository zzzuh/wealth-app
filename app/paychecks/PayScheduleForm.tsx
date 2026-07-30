"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { input, buttonPrimary, errorText, label, formShell } from "@/lib/ui";

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
    <form onSubmit={handleSubmit} className={formShell}>
      <div className="flex flex-col gap-1.5">
        <label className={label}>Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={input}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="semimonthly">Semimonthly</option>
          <option value="monthly">Monthly</option>
        </select>
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

      <div className="flex flex-col gap-1.5">
        <label className={label}>Next pay date</label>
        <input
          required
          type="date"
          value={nextPayDate}
          onChange={(e) => setNextPayDate(e.target.value)}
          className={input}
        />
      </div>

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Saving..." : "Save schedule"}
      </button>

      {error && <p className={`w-full ${errorText}`}>{error}</p>}
    </form>
  );
}
