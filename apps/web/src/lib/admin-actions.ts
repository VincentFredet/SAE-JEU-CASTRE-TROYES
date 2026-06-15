"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, OrderStatus, Role } from "@jeux/db";
import { auth } from "@/lib/auth";

async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("forbidden");
  return session.user.id;
}

const cuid = z.string().min(1);

const updateProductSchema = z.object({
  id: cuid,
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0),
  active: z.boolean(),
});

const createProductSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "slug"),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0),
  nameFr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
});

const orderStatusSchema = z.object({
  id: cuid,
  status: z.nativeEnum(OrderStatus),
});

const userRoleSchema = z.object({
  id: cuid,
  role: z.nativeEnum(Role),
});

function eurosToCents(value: FormDataEntryValue | null): number {
  const euros = Number(value);
  if (!Number.isFinite(euros)) return NaN;
  return Math.round(euros * 100);
}

function intOf(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export async function updateProduct(formData: FormData) {
  await requireAdminId();

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    priceCents: eurosToCents(formData.get("price")),
    stock: intOf(formData.get("stock")),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) throw new Error("invalid");

  await prisma.product.update({
    where: { id: parsed.data.id },
    data: {
      priceCents: parsed.data.priceCents,
      stock: parsed.data.stock,
      active: parsed.data.active,
    },
  });

  revalidatePath("/admin/products");
}

export async function createProduct(formData: FormData) {
  await requireAdminId();

  const parsed = createProductSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    priceCents: eurosToCents(formData.get("price")),
    stock: intOf(formData.get("stock")),
    nameFr: String(formData.get("nameFr") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim(),
  });
  if (!parsed.success) throw new Error("invalid");

  await prisma.product.create({
    data: {
      slug: parsed.data.slug,
      priceCents: parsed.data.priceCents,
      stock: parsed.data.stock,
      translations: {
        create: [
          { locale: "fr", name: parsed.data.nameFr, description: "" },
          { locale: "en", name: parsed.data.nameEn, description: "" },
        ],
      },
    },
  });

  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdminId();

  const id = cuid.safeParse(formData.get("id"));
  if (!id.success) throw new Error("invalid");

  await prisma.product.delete({ where: { id: id.data } });

  revalidatePath("/admin/products");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdminId();

  const parsed = orderStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("invalid");

  await prisma.order.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/orders");
}

export async function setUserRole(formData: FormData) {
  const adminId = await requireAdminId();

  const parsed = userRoleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error("invalid");

  // Garde-fou : un admin ne peut pas se retirer son propre role admin.
  if (parsed.data.id === adminId && parsed.data.role !== "ADMIN") {
    throw new Error("cannot-demote-self");
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { role: parsed.data.role },
  });

  revalidatePath("/admin/users");
}
