"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { reserveClickAndCollect, type CncFormState } from "@/lib/cnc-actions";
import { inputField as field, buttonPrimary } from "@/lib/ui";

type Props = {
  shopId: number;
  productId: number;
  email: string;
  maxQuantity: number;
};

export function ClickCollectForm({ shopId, productId, email, maxQuantity }: Props) {
  const t = useTranslations("clickCollect");
  const [state, action, pending] = useActionState<CncFormState, FormData>(
    reserveClickAndCollect,
    null,
  );

  if (state?.status === "reserved") {
    return (
      <div className="rounded-xl border border-pine/30 bg-pine/10 px-4 py-3 text-sm text-pine">
        <p className="font-semibold">{t("reserved")}</p>
        {state.reference && <p className="mt-1 text-ink-soft">{t("reference", { ref: state.reference })}</p>}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {(state?.status === "error" || state?.status === "outofstock") && (
        <p className="rounded-xl border border-clay/30 bg-clay/10 px-3.5 py-2.5 text-sm font-medium text-clay-deep">
          {state.status === "outofstock" ? t("outOfStock") : t("error")}
        </p>
      )}

      <input type="hidden" name="shopId" value={shopId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="email" value={email} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("firstName")}
          <input name="firstName" autoComplete="given-name" required className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {t("lastName")}
          <input name="lastName" autoComplete="family-name" required className={field} />
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">{t("paymentChoice")}</legend>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="radio" name="paymentChoice" value="on_reception" defaultChecked />
          {t("payOnReception")}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="radio" name="paymentChoice" value="online" />
          {t("payOnline")}
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={`${buttonPrimary} mt-1 w-full py-3`}>
        {t("reserve")}
      </button>
    </form>
  );
}
