"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { dueDateFromDay } from "@/lib/due-day";
import { formatDate } from "@/lib/format";
import { input, buttonPrimary, buttonSecondary, buttonAdd, errorText, label } from "@/lib/ui";

interface Card {
  id: string;
  nickname: string;
  due_day: number | null;
}

function dueDayOf(card: Card | undefined) {
  return card?.due_day == null ? "" : String(card.due_day);
}

export default function AddStatementButton({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [statementBalance, setStatementBalance] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  // Prefilled from the card's billing day, but still editable per statement.
  const [dueDay, setDueDay] = useState(dueDayOf(cards[0]));
  const [statementDate, setStatementDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const day = Number(dueDay);
  const resolvedDueDate = day >= 1 && day <= 31 ? dueDateFromDay(day) : null;

  // Seeded on open, not in useState: this component first mounts while the
  // cards list may still be empty, and router.refresh() updates props without
  // re-running a state initializer — so opening is the only reliable moment to
  // sync the selected card and its prefilled billing day.
  function openModal() {
    const card = cards.find((c) => c.id === cardId) ?? cards[0];
    setCardId(card?.id ?? "");
    setDueDay(dueDayOf(card));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedDueDate) {
      setError("Enter a due day between 1 and 31");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/card-statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        statement_balance: statementBalance,
        minimum_payment: minimumPayment,
        due_date: resolvedDueDate,
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
    setDueDay(dueDayOf(cards.find((c) => c.id === cardId)));
    setStatementDate("");
    close();
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={buttonAdd} aria-label="Add statement">
        +
      </button>
      <Modal open={open} onClose={close} title="Add statement">
        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">Add a card first before recording statements.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className={label}>Card</label>
              <select
                value={cardId}
                onChange={(e) => {
                  setCardId(e.target.value);
                  setDueDay(dueDayOf(cards.find((c) => c.id === e.target.value)));
                }}
                className={`w-full ${input}`}
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label}>Due day of month</label>
              <input
                required
                type="number"
                min="1"
                max="31"
                step="1"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="15"
                className={`w-full ${input}`}
              />
              <p className="text-xs text-slate-400">
                {resolvedDueDate ? `Due ${formatDate(resolvedDueDate)}` : "The next occurrence of this day is used."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label}>Statement balance</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                className={`w-full ${input}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label}>Minimum payment</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                className={`w-full ${input}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={label}>Statement date (optional)</label>
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className={`w-full ${input}`}
              />
            </div>

            {error && <p className={errorText}>{error}</p>}

            <div className="flex justify-end gap-4">
              <button type="button" onClick={close} className={buttonSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={buttonPrimary}>
                {submitting ? "Adding..." : "Add statement"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
