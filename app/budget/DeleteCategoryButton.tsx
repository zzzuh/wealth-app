"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleConfirm() {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <ConfirmDeleteButton itemLabel={name} onConfirm={handleConfirm} />;
}
