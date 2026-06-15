"use client";

import { deleteProduct } from "@/lib/admin-actions";

export function DeleteProductButton({ id, label, confirmText }: { id: string; label: string; confirmText: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-clay transition hover:border-clay hover:bg-clay/5"
      >
        {label}
      </button>
    </form>
  );
}
