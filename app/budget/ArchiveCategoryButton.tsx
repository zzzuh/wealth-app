"use client";

import { useRouter } from "next/navigation";

export default function ArchiveCategoryButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="text-xs text-slate-400 hover:text-red-600">
      Archive
    </button>
  );
}
