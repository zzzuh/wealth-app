"use client";

import { useRouter } from "next/navigation";
import { buttonGhostDanger } from "@/lib/ui";

export default function ArchiveCategoryButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className={buttonGhostDanger}>
      Archive
    </button>
  );
}
