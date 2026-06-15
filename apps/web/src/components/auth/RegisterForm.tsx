"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction, type AuthFormState } from "@/lib/auth-actions";
import { Link } from "@/i18n/navigation";
import { inputField as field } from "@/lib/ui";

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {t(state.error)}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("username")}
        <input name="username" minLength={3} maxLength={20} required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("email")}
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("password")}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={field}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {t("submitRegister")}
      </button>
      <p className="text-sm text-zinc-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-zinc-900 dark:text-white">
          {t("loginTitle")}
        </Link>
      </p>
    </form>
  );
}
