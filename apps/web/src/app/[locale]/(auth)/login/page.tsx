import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  await initLocale(params);
  if (await auth()) redirect("/");

  const t = await getTranslations("auth");
  const tc = await getTranslations("common");

  return (
    <AuthShell
      aside="left"
      appName={tc("appName")}
      tagline={tc("tagline")}
      title={t("loginTitle")}
    >
      <LoginForm />
    </AuthShell>
  );
}
