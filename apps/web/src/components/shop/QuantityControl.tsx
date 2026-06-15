"use client";

import { useTranslations } from "next-intl";
import { updateCartItem, removeCartItem } from "@/lib/cart-actions";

type Props = {
  itemId: string;
  quantity: number;
  max: number;
};

const stepButton =
  "grid h-9 w-9 place-items-center text-base font-semibold text-ink transition hover:bg-clay hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink";

export function QuantityControl({ itemId, quantity, max }: Props) {
  const t = useTranslations("shop");

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className="flex items-center overflow-hidden rounded-full border border-line bg-cream/60"
        aria-label={t("quantity")}
      >
        <form action={updateCartItem.bind(null, itemId, quantity - 1)}>
          <button type="submit" className={stepButton} aria-label="-">
            -
          </button>
        </form>
        <span className="w-8 text-center text-sm font-semibold tabular-nums text-ink">
          {quantity}
        </span>
        <form action={updateCartItem.bind(null, itemId, quantity + 1)}>
          <button type="submit" className={stepButton} disabled={quantity >= max} aria-label="+">
            +
          </button>
        </form>
      </div>
      <form action={removeCartItem.bind(null, itemId)}>
        <button
          type="submit"
          className="text-sm font-medium text-ink-soft underline-offset-4 transition hover:text-clay hover:underline"
        >
          {t("remove")}
        </button>
      </form>
    </div>
  );
}
