"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/orders";

export async function checkout() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: { include: { translations: { where: { locale: "fr" } } } } } },
    },
  });
  if (!cart || cart.items.length === 0) redirect("/cart");

  const items = cart.items;
  if (new Set(items.map((i) => i.product.currency)).size > 1) redirect("/cart?error=1");
  if (items.some((i) => i.quantity > i.product.stock)) redirect("/cart?error=1");

  const currency = items[0].product.currency;
  const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      totalCents,
      currency,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPriceCents: i.product.priceCents,
        })),
      },
    },
  });

  if (stripe) {
    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    let url: string;
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: i.product.priceCents,
            product_data: { name: i.product.translations[0]?.name ?? i.product.slug },
          },
        })),
        success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/cart`,
        metadata: { orderId: order.id },
        client_reference_id: order.id,
      });
      await prisma.order.update({ where: { id: order.id }, data: { stripeSession: checkoutSession.id } });
      url = checkoutSession.url ?? `${base}/cart?error=1`;
    } catch {
      redirect("/cart?error=1");
    }
    redirect(url);
  }

  try {
    await fulfillOrder(order.id);
  } catch {
    redirect("/cart?error=1");
  }
  revalidatePath("/cart");
  revalidatePath("/shop");
  redirect("/cart?ordered=1");
}
