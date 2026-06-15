import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { RegisterForm } from "@/components/auth/RegisterForm";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  await initLocale(params);
  if (await auth()) redirect("/");

  const t = await getTranslations("auth");
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("registerTitle")}</h1>
      <RegisterForm />
    </div>
  );
}
