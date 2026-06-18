"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createClickAndCollect, cncInputSchema, ReliquesApiError } from "@/lib/reliques-api";

export type CncFormState = { status: "error" | "outofstock" | "reserved"; reference?: string } | null;

// Réserve un produit en click & collect. Paiement en ligne -> redirection Stripe ;
// au retrait -> confirmation avec référence.
export async function reserveClickAndCollect(
  _prev: CncFormState,
  formData: FormData,
): Promise<CncFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = cncInputSchema.safeParse({
    shopId: Number(formData.get("shopId")),
    productId: Number(formData.get("productId")),
    quantity: Number(formData.get("quantity")),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: session.user.email ?? formData.get("email"),
    paymentChoice: formData.get("paymentChoice"),
  });
  if (!parsed.success) return { status: "error" };

  let checkoutUrl: string | null = null;
  let reference: string | undefined;
  try {
    const res = await createClickAndCollect(parsed.data);
    checkoutUrl = res.checkoutUrl ?? null;
    reference = res.reference ?? undefined;
  } catch (e) {
    // 409 = règle métier (stock insuffisant pour le retrait), pas une vraie erreur.
    if (e instanceof ReliquesApiError && e.status === 409) return { status: "outofstock" };
    console.error("[reserveClickAndCollect] failed:", e);
    return { status: "error" };
  }

  if (parsed.data.paymentChoice === "online" && checkoutUrl) redirect(checkoutUrl);
  return { status: "reserved", reference };
}
