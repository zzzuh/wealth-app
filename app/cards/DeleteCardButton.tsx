"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default function DeleteCardButton({ id, nickname }: { id: string; nickname: string }) {
  const router = useRouter();

  async function handleConfirm() {
    await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <ConfirmDeleteButton itemLabel={nickname} onConfirm={handleConfirm} />;
}
