"use client";

import { useState } from "react";
import Modal from "./Modal";
import { buttonGhostDanger, buttonSecondary, buttonDanger } from "@/lib/ui";

export default function ConfirmDeleteButton({
  itemLabel,
  onConfirm,
  label = "Delete",
}: {
  itemLabel: string;
  onConfirm: () => Promise<void>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    await onConfirm();
    setPending(false);
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonGhostDanger}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Delete ${itemLabel}?`}>
        <p className="text-sm text-slate-500">This can&apos;t be undone.</p>
        <div className="mt-5 flex justify-end gap-4">
          <button type="button" onClick={() => setOpen(false)} className={buttonSecondary}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={pending} className={buttonDanger}>
            {pending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
