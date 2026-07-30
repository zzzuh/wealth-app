"use client";

import { useRouter } from "next/navigation";

export default function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="text-xs text-slate-400 hover:text-red-600">
      Delete
    </button>
  );
}
