import { auth } from "@/lib/auth";
import { initLocale } from "@/lib/locale";
import { PlayEntry } from "@/components/reliques/PlayEntry";

type Props = { params: Promise<{ locale: string }> };

export default async function PlayPage({ params }: Props) {
  await initLocale(params);
  const session = await auth();
  return <PlayEntry authed={!!session?.user} />;
}
