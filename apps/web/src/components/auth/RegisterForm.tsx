"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction, type AuthFormState } from "@/lib/auth-actions";
import { Link } from "@/i18n/navigation";
import { inputField as field, buttonPrimary } from "@/lib/ui";

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-xl border border-clay/30 bg-clay/10 px-3.5 py-2.5 text-sm font-medium text-clay-deep">
          {t(state.error)}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("username")}
        <input name="username" minLength={3} maxLength={20} required className={field} />
        <span className="text-xs font-normal text-ink-soft">{t("usernameHint")}</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("email")}
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("password")}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={field}
        />
        <span className="text-xs font-normal text-ink-soft">{t("passwordHint")}</span>
      </label>
      <button type="submit" disabled={pending} className={`${buttonPrimary} mt-1 w-full py-3`}>
        {t("submitRegister")}
      </button>
      <p className="text-sm text-ink-soft">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-clay transition hover:text-clay-deep">
          {t("loginTitle")}
        </Link>
      </p>
    </form>
  );
}
