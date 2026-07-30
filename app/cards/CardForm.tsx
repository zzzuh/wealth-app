"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CardForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [issuer, setIssuer] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [autopayType, setAutopayType] = useState("minimum");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Nickname</label>
        <input
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Chase Sapphire Reserve"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Issuer</label>
        <input
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Last 4</label>
        <input
          value={lastFour}
          maxLength={4}
          onChange={(e) => setLastFour(e.target.value)}
          className="w-16 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 pb-1.5">
        <input
          id="autopay"
          type="checkbox"
          checked={autopayEnabled}
          onChange={(e) => setAutopayEnabled(e.target.checked)}
        />
        <label htmlFor="autopay" className="text-sm text-slate-600">
          Autopay
        </label>
      </div>

      {autopayEnabled && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Autopay type</label>
          <select
            value={autopayType}
            onChange={(e) => setAutopayType(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="minimum">Minimum</option>
            <option value="statement_balance">Statement balance</option>
            <option value="full_balance">Full balance</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add card"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
