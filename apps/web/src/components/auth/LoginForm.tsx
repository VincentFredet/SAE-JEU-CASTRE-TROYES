"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type AuthFormState } from "@/lib/auth-actions";
import { Link } from "@/i18n/navigation";
import { inputField as field, buttonPrimary } from "@/lib/ui";

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-xl border border-clay/30 bg-clay/10 px-3.5 py-2.5 text-sm font-medium text-clay-deep">
          {t(state.error)}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("email")}
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("password")}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </label>
      <button type="submit" disabled={pending} className={`${buttonPrimary} mt-1 w-full py-3`}>
        {t("submitLogin")}
      </button>
      <p className="text-sm text-ink-soft">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-clay transition hover:text-clay-deep">
          {t("registerTitle")}
        </Link>
      </p>
    </form>
  );
}
