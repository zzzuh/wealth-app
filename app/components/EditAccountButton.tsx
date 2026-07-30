"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { input, buttonPrimary, errorText, label, buttonSecondary } from "@/lib/ui";

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings";
  balance: string;
}

export default function EditAccountButton({ account }: { account: Account }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<"checking" | "savings">(account.type);
  const [balance, setBalance] = useState(account.balance);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, balance }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save account");
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
      <Modal open={open} onClose={() => setOpen(false)} title="Edit account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={`w-full ${input}`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "checking" | "savings")}
              className={`w-full ${input}`}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Balance</label>
            <input
              required
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={`w-full ${input}`}
            />
          </div>

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
