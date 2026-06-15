import { prisma } from "@jeux/db";

// Valide une commande : decremente le stock (atomique), passe la commande en PAID
// et vide le panier. Idempotent (no-op si deja PAID).
export async function fulfillOrder(orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === "PAID") return false;

    for (const item of order.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new Error("out_of_stock");
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    await tx.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
    return true;
  });
}
