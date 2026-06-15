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
