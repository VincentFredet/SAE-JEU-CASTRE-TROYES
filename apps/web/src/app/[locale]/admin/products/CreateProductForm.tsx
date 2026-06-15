"use client";

import { useState } from "react";
import { createProduct } from "@/lib/admin-actions";
import { buttonPrimary, buttonGhost, inputField } from "@/lib/ui";

type Labels = {
  create: string;
  cancel: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  price: string;
  stock: string;
  submit: string;
};

export function CreateProductForm({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonPrimary}>
        {labels.create}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createProduct(formData);
        setOpen(false);
      }}
      className="rounded-2xl border border-line bg-white/70 p-5 shadow-[0_1px_2px_rgba(33,26,19,0.04)]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink-soft">{labels.slug}</span>
          <input name="slug" required pattern="[a-z0-9-]+" className={inputField} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink-soft">{labels.price}</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputField}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink-soft">{labels.nameFr}</span>
          <input name="nameFr" required className={inputField} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink-soft">{labels.nameEn}</span>
          <input name="nameEn" required className={inputField} />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink-soft">{labels.stock}</span>
          <input
            name="stock"
            type="number"
            step="1"
            min="0"
            defaultValue={0}
            required
            className={inputField}
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className={buttonPrimary}>
          {labels.submit}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonGhost}>
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}
