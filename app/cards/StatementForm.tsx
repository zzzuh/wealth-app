"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Card {
  id: string;
  nickname: string;
}

export default function StatementForm({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [statementBalance, setStatementBalance] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/card-statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        statement_balance: statementBalance,
        minimum_payment: minimumPayment,
        due_date: dueDate,
        statement_date: statementDate || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add statement");
      return;
    }

    setStatementBalance("");
    setMinimumPayment("");
    setDueDate("");
    setStatementDate("");
    router.refresh();
  }

  if (cards.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Add a card first before recording statements.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Card</label>
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nickname}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Statement date</label>
        <input
          type="date"
          value={statementDate}
          onChange={(e) => setStatementDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Due date</label>
        <input
          required
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Statement balance</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={statementBalance}
          onChange={(e) => setStatementBalance(e.target.value)}
          className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Minimum payment</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={minimumPayment}
          onChange={(e) => setMinimumPayment(e.target.value)}
          className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add statement"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
