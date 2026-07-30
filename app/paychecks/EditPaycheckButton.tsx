"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { input, buttonPrimary, errorText, label, buttonSecondary } from "@/lib/ui";

interface Paycheck {
  id: string;
  pay_date: string;
  net_amount: string;
}

export default function EditPaycheckButton({ paycheck }: { paycheck: Paycheck }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [payDate, setPayDate] = useState(paycheck.pay_date.slice(0, 10));
  const [netAmount, setNetAmount] = useState(paycheck.net_amount);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/paychecks/${paycheck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pay_date: payDate, net_amount: netAmount }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save paycheck");
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
      <Modal open={open} onClose={() => setOpen(false)} title="Edit paycheck">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Pay date</label>
            <input
              required
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className={`w-full ${input}`}
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
              className={`w-full ${input}`}
            />
          </div>

          <p className="text-xs text-slate-400">
            Already-generated allocations for this paycheck won&apos;t be recalculated.
          </p>

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
