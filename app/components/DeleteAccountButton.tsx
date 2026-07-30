"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

export default function DeleteAccountButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleConfirm() {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <ConfirmDeleteButton itemLabel={name} onConfirm={handleConfirm} />;
}
