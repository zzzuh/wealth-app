"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonGhost, buttonGhostSuccess } from "@/lib/ui";

export default function TogglePaidButton({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await fetch(`/api/card-statements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        paid
          ? { paid: false }
          : { paid: true, paid_date: new Date().toISOString().slice(0, 10) }
      ),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={pending} className={paid ? buttonGhost : buttonGhostSuccess}>
      {paid ? "Mark unpaid" : "Mark paid"}
    </button>
  );
}
