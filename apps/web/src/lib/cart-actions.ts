"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@jeux/db";
import { auth } from "@/lib/auth";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}

async function getOrCreateCartId(userId: string): Promise<string> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return cart.id;
}

export async function addToCart(productId: string) {
  const userId = await requireUserId();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, active: true },
  });
  if (!product || !product.active || product.stock <= 0) return;

  const cartId = await getOrCreateCartId(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { quantity: true },
  });
  const quantity = Math.min((existing?.quantity ?? 0) + 1, product.stock);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity },
    create: { cartId, productId, quantity },
  });

  revalidatePath("/cart");
}

export async function updateCartItem(itemId: string, quantity: number) {
  const userId = await requireUserId();
  if (quantity <= 0) {
    await removeCartItem(itemId);
    return;
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    select: { product: { select: { stock: true } } },
  });
  if (!item) return;

  const bounded = Math.min(Math.floor(quantity), item.product.stock);
  if (bounded <= 0) {
    await removeCartItem(itemId);
    return;
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: bounded } });
  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string) {
  const userId = await requireUserId();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
  revalidatePath("/cart");
}

export async function checkout() {
  const userId = await requireUserId();

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) redirect("/cart");

  const items = cart.items;
  if (new Set(items.map((i) => i.product.currency)).size > 1) redirect("/cart?error=1");

  const currency = items[0].product.currency;
  const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  try {
    await prisma.$transaction(async (tx) => {
      for (const i of items) {
        const updated = await tx.product.updateMany({
          where: { id: i.productId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (updated.count !== 1) throw new Error("out_of_stock");
      }
      await tx.order.create({
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
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
  } catch {
    redirect("/cart?error=1");
  }

  revalidatePath("/cart");
  revalidatePath("/shop");
  redirect("/cart?ordered=1");
}
