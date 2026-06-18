"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { placeOrder, type OrderFormState } from "@/lib/order-actions";
import { inputField as field, buttonPrimary } from "@/lib/ui";

type Props = {
  productId: number;
  email: string;
  maxQuantity: number;
};

export function CheckoutForm({ productId, email, maxQuantity }: Props) {
  const t = useTranslations("checkout");
  const [state, action, pending] = useActionState<OrderFormState, FormData>(placeOrder, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-xl border border-clay/30 bg-clay/10 px-3.5 py-2.5 text-sm font-medium text-clay-deep">
          {state.error === "invalid" ? t("errorInvalid") : t("errorServer")}
        </p>
      )}

      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="email" value={email} />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("firstName")}
          <input name="firstName" autoComplete="given-name" required className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("lastName")}
          <input name="lastName" autoComplete="family-name" required className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("email")}
        <input value={email} readOnly className={`${field} opacity-70`} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("address")}
        <input name="address" autoComplete="street-address" required className={field} />
      </label>

      <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("postalCode")}
          <input name="postalCode" autoComplete="postal-code" required className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("city")}
          <input name="city" autoComplete="address-level2" required className={field} />
        </label>
      </div>

      <label className="flex w-32 flex-col gap-1.5 text-sm font-medium text-ink">
        {t("quantity")}
        <input
          name="quantity"
          type="number"
          min={1}
          max={Math.max(1, maxQuantity)}
          defaultValue={1}
          required
          className={field}
        />
      </label>

      <button type="submit" disabled={pending} className={`${buttonPrimary} mt-1 w-full py-3`}>
        {t("pay")}
      </button>
      <p className="text-center text-xs text-ink-soft">{t("payNote")}</p>
    </form>
  );
}
