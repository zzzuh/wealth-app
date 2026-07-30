"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";
import { input, buttonPrimary, errorText, label, buttonSecondary } from "@/lib/ui";

interface Category {
  id: string;
  name: string;
  allocation_type: "fixed" | "percentage";
  fixed_amount: string | null;
  percentage: string | null;
}

export default function EditCategoryButton({ category }: { category: Category }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [allocationType, setAllocationType] = useState(category.allocation_type);
  const [amount, setAmount] = useState(
    category.allocation_type === "fixed" ? category.fixed_amount ?? "" : category.percentage ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: Record<string, unknown> = { name, allocation_type: allocationType };
    if (allocationType === "fixed") body.fixed_amount = amount;
    else body.percentage = amount;

    const res = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save category");
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
      <Modal open={open} onClose={() => setOpen(false)} title="Edit category">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={`w-full ${input}`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>Type</label>
            <select
              value={allocationType}
              onChange={(e) => setAllocationType(e.target.value as "fixed" | "percentage")}
              className={`w-full ${input}`}
            >
              <option value="fixed">Fixed $</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label}>{allocationType === "fixed" ? "Amount" : "Percent"}</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
