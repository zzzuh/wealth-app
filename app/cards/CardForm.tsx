"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { input, buttonPrimary, errorText, label, formShell } from "@/lib/ui";

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
    <form onSubmit={handleSubmit} className={formShell}>
      <div className="flex flex-col gap-1.5">
        <label className={label}>Nickname</label>
        <input
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Chase Sapphire Reserve"
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Issuer</label>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className={input} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={label}>Last 4</label>
        <input
          value={lastFour}
          maxLength={4}
          onChange={(e) => setLastFour(e.target.value)}
          className={`w-16 ${input}`}
        />
      </div>

      <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
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
          <select value={autopayType} onChange={(e) => setAutopayType(e.target.value)} className={input}>
            <option value="minimum">Minimum</option>
            <option value="statement_balance">Statement balance</option>
            <option value="full_balance">Full balance</option>
          </select>
        </div>
      )}

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? "Adding..." : "Add card"}
      </button>

      {error && <p className={`w-full ${errorText}`}>{error}</p>}
    </form>
  );
}
