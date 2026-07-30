"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { input, buttonPrimary, errorText, label, buttonSecondary } from "@/lib/ui";

interface Card {
  id: string;
  nickname: string;
  issuer: string | null;
  last_four: string | null;
  autopay_enabled: boolean;
  autopay_type: string | null;
}

export default function EditCardButton({ card }: { card: Card }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(card.nickname);
  const [issuer, setIssuer] = useState(card.issuer ?? "");
  const [lastFour, setLastFour] = useState(card.last_four ?? "");
  const [autopayEnabled, setAutopayEnabled] = useState(card.autopay_enabled);
  const [autopayType, setAutopayType] = useState(card.autopay_type ?? "minimum");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/credit-cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        issuer: issuer || null,
        last_four: lastFour || null,
        autopay_enabled: autopayEnabled,
        autopay_type: autopayEnabled ? autopayType : null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save card");
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
      <Modal open={open} onClose={() => setOpen(false)} title="Edit card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Nickname</label>
            <input
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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
              <select value={autopayType} onChange={(e) => setAutopayType(e.target.value)} className={`w-full ${input}`}>
                <option value="minimum">Minimum</option>
                <option value="statement_balance">Statement balance</option>
                <option value="full_balance">Full balance</option>
              </select>
            </div>
          )}

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
