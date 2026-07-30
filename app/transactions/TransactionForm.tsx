"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { input, buttonPrimary, errorText, label, formShell } from "@/lib/ui";

interface Category {
  id: string;
  name: string;
}

interface Paycheck {
  id: string;
  pay_date: string;
}

export default function TransactionForm({
  categories,
  paychecks,
}: {
  categories: Category[];
  paychecks: Paycheck[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [paycheckId, setPaycheckId] = useState(paychecks[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        paycheck_id: paycheckId || null,
        amount,
        merchant: merchant || null,
        description: description || null,
        txn_date: txnDate,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add transaction");
      return;
    }

    setAmount("");
    setMerchant("");
    setDescription("");
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
        Add a budget category first before logging transactions.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={formShell}>
      <div className="flex flex-col gap-1.5">
        <label className={label}>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Paycheck</label>
        <select value={paycheckId} onChange={(e) => setPaycheckId(e.target.value)} className={input}>
          <option value="">None</option>
          {paychecks.map((p) => (
            <option key={p.id} value={p.id}>
              {formatDate(p.pay_date)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Date</label>
        <input
          required
          type="date"
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Amount</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-28 ${input}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Merchant</label>
        <input value={merchant} onChange={(e) => setMerchant(e.target.value)} className={input} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
      </div>

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Adding..." : "Add transaction"}
      </button>

      {error && <p className={`w-full ${errorText}`}>{error}</p>}
    </form>
  );
}
