"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { input, buttonPrimary, buttonSecondary, buttonAdd, errorText, label } from "@/lib/ui";

export default function AddCardButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [issuer, setIssuer] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [autopayType, setAutopayType] = useState("minimum");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        issuer: issuer || null,
        last_four: lastFour || null,
        due_day: dueDay || null,
        autopay_enabled: autopayEnabled,
        autopay_type: autopayEnabled ? autopayType : null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add card");
      return;
    }

    setNickname("");
    setIssuer("");
    setLastFour("");
    setDueDay("");
    setAutopayEnabled(false);
    setAutopayType("minimum");
    close();
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonAdd} aria-label="Add card">
        +
      </button>
      <Modal open={open} onClose={close} title="Add card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Nickname</label>
            <input
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Chase Sapphire Reserve"
              className={`w-full ${input}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Issuer</label>
            <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className={`w-full ${input}`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Last 4</label>
            <input
              value={lastFour}
              maxLength={4}
              onChange={(e) => setLastFour(e.target.value)}
              className={`w-full ${input}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Payment due day</label>
            <input
              type="number"
              min="1"
              max="31"
              step="1"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="15"
              className={`w-full ${input}`}
            />
            <p className="text-xs text-slate-400">Day of the month this card bills. Prefills new statements.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autopayEnabled}
              onChange={(e) => setAutopayEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            Autopay
          </label>

          {autopayEnabled && (
            <div className="flex flex-col gap-1.5">
              <label className={label}>Autopay type</label>
              <select
                value={autopayType}
                onChange={(e) => setAutopayType(e.target.value)}
                className={`w-full ${input}`}
              >
                <option value="minimum">Minimum</option>
                <option value="statement_balance">Statement balance</option>
                <option value="full_balance">Full balance</option>
              </select>
            </div>
          )}

          {error && <p className={errorText}>{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={close} className={buttonSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Adding..." : "Add card"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
