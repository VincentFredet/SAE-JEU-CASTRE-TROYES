"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { register as apiRegister, RegisterConflictError } from "@/lib/reliques-api";
import { mirrorApiUser } from "@/lib/user-mirror";

type AuthErrorKey =
  | "invalidCredentials"
  | "emailTaken"
  | "usernameTaken"
  | "invalidInput"
  | "invalidEmail"
  | "invalidUsername"
  | "invalidPassword"
  | "serverError";
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
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return { error: "invalidEmail" };
    if (field === "username") return { error: "invalidUsername" };
    if (field === "password") return { error: "invalidPassword" };
    return { error: "invalidInput" };
  }
  const { email, username, password } = parsed.data;

  // Création du compte côté API partenaire (source de vérité).
  try {
    await apiRegister(email, username, password);
  } catch (e) {
    if (e instanceof RegisterConflictError) {
      if (e.field === "username") return { error: "usernameTaken" };
      if (e.field === "email") return { error: "emailTaken" };
      return { error: "invalidInput" };
    }
    console.error("[register] API register failed:", e);
    return { error: "serverError" };
  }

  // Miroir local (avec le username choisi) avant la connexion, pour les scores/leaderboard.
  await mirrorApiUser({ email, username });

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
