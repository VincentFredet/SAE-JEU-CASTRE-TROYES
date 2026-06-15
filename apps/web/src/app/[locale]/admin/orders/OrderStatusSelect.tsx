"use client";

import { useRef } from "react";
import { updateOrderStatus } from "@/lib/admin-actions";

type Option = { value: string; label: string };

export function OrderStatusSelect({
  id,
  current,
  options,
}: {
  id: string;
  current: string;
  options: Option[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={updateOrderStatus} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
