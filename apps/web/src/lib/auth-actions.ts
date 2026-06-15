"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@jeux/db";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

type AuthErrorKey = "invalidCredentials" | "emailTaken" | "usernameTaken" | "invalidInput";
export type AuthFormState = { error: AuthErrorKey } | null;

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) return { error: "invalidCredentials" };
    throw e;
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalidInput" };
  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (existing) return { error: existing.email === email ? "emailTaken" : "usernameTaken" };

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({ data: { email, username, passwordHash, cart: { create: {} } } });
  } catch (e) {
    const err = e as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002") {
      return { error: err.meta?.target?.includes("username") ? "usernameTaken" : "emailTaken" };
    }
    throw e;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return null;
  } catch (e) {
    if (e instanceof AuthError) return { error: "invalidCredentials" };
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
