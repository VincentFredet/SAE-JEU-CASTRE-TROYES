import { initLocale } from "@/lib/locale";
import { ReliquesGame } from "@/components/reliques/ReliquesGame";

type Props = { params: Promise<{ locale: string }> };

// Mode hotseat : on joue à plusieurs autour d'un seul appareil (pas besoin de compte
// ni de serveur). La version en ligne (1 téléphone par joueur) vit sur /play.
export default async function TablePage({ params }: Props) {
  await initLocale(params);
  return <ReliquesGame />;
}
