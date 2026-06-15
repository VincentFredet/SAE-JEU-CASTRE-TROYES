"use client";

import { useTranslations } from "next-intl";
import { updateCartItem, removeCartItem } from "@/lib/cart-actions";

type Props = {
  itemId: string;
  quantity: number;
  max: number;
};

const stepButton =
  "grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 text-sm font-semibold transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900";

export function QuantityControl({ itemId, quantity, max }: Props) {
  const t = useTranslations("shop");

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" aria-label={t("quantity")}>
        <form action={updateCartItem.bind(null, itemId, quantity - 1)}>
          <button type="submit" className={stepButton} aria-label="-">
            -
          </button>
        </form>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
        <form action={updateCartItem.bind(null, itemId, quantity + 1)}>
          <button type="submit" className={stepButton} disabled={quantity >= max} aria-label="+">
            +
          </button>
        </form>
      </div>
      <form action={removeCartItem.bind(null, itemId)}>
        <button
          type="submit"
          className="text-sm font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:hover:text-white"
        >
          {t("remove")}
        </button>
      </form>
    </div>
  );
}
