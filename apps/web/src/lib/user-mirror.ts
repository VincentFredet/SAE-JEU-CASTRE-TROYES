import { prisma, type Role } from "@jeux/db";

type MirroredUser = {
  id: string;
  email: string;
  name: string | null;
  username: string;
  role: Role;
};

function baseUsername(email: string): string {
  const base = (email.split("@")[0] ?? "").replace(/[^\p{L}\p{N}._-]/gu, "").slice(0, 20);
  return base.length >= 3 ? base : "joueur";
}

// Crée/retrouve le miroir local d'un compte API (clé : email). Le miroir porte les
// relations locales que l'API n'a pas (scores/leaderboard, rôle de session). On garde
// le username existant ; sinon on le dérive de l'email, avec suffixe si collision.
export async function mirrorApiUser(opts: {
  email: string;
  username?: string;
}): Promise<MirroredUser> {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) return existing;

  let username = opts.username?.trim() || baseUsername(opts.email);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await prisma.user.create({ data: { email: opts.email, username, role: "USER" } });
    } catch (e) {
      const err = e as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2002" && err.meta?.target?.includes("username")) {
        username = `${baseUsername(opts.email).slice(0, 14)}-${attempt + 1}`;
        continue;
      }
      throw e;
    }
  }
  throw new Error(`could not mirror API user ${opts.email}`);
}
