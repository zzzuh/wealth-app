"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default function DeletePayScheduleButton({ id, frequency }: { id: string; frequency: string }) {
  const router = useRouter();

  async function handleConfirm() {
    await fetch(`/api/pay-schedules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <ConfirmDeleteButton itemLabel={`${frequency} pay schedule`} onConfirm={handleConfirm} />;
}
