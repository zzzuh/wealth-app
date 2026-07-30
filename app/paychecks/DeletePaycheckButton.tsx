"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";
import { formatDate } from "@/lib/format";

export default function DeletePaycheckButton({ id, payDate }: { id: string; payDate: string }) {
  const router = useRouter();

  async function handleConfirm() {
    await fetch(`/api/paychecks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <ConfirmDeleteButton itemLabel={`paycheck ${formatDate(payDate)}`} onConfirm={handleConfirm} />;
}
