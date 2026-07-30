"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { input, buttonPrimary, errorText, label, buttonSecondary } from "@/lib/ui";

interface PaySchedule {
  id: string;
  frequency: string;
  net_amount: string;
  next_pay_date: string;
  active: boolean;
}

export default function EditPayScheduleButton({ schedule }: { schedule: PaySchedule }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState(schedule.frequency);
  const [netAmount, setNetAmount] = useState(schedule.net_amount);
  const [nextPayDate, setNextPayDate] = useState(schedule.next_pay_date.slice(0, 10));
  const [active, setActive] = useState(schedule.active);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/pay-schedules/${schedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frequency,
        net_amount: netAmount,
        next_pay_date: nextPayDate,
        active,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save pay schedule");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonSecondary}>
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit pay schedule">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className={`w-full ${input}`}
            >
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
              className={`w-full ${input}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Next pay date</label>
            <input
              required
              type="date"
              value={nextPayDate}
              onChange={(e) => setNextPayDate(e.target.value)}
              className={`w-full ${input}`}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            Active
          </label>

          {error && <p className={errorText}>{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setOpen(false)} className={buttonSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
