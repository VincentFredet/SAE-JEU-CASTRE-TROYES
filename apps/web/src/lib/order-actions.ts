"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createOrder, orderInputSchema } from "@/lib/reliques-api";

export type OrderFormState = { error: "invalid" | "server" } | null;

// Crée la commande côté API puis redirige vers son checkoutUrl Stripe.
export async function placeOrder(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = orderInputSchema.safeParse({
    productId: Number(formData.get("productId")),
    quantity: Number(formData.get("quantity")),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: session.user.email ?? formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
  });
  if (!parsed.success) return { error: "invalid" };

  let checkoutUrl: string | null = null;
  try {
    const order = await createOrder(parsed.data);
    checkoutUrl = order.checkoutUrl ?? null;
  } catch (e) {
    console.error("[placeOrder] order creation failed:", e);
    return { error: "server" };
  }

  if (!checkoutUrl) return { error: "server" };
  redirect(checkoutUrl);
}
