"use client";

import { useEffect, useRef } from "react";
import { modalPanel, modalTitle } from "@/lib/ui";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} className={modalPanel}>
      <h2 className={modalTitle}>{title}</h2>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
