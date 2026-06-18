import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma, type Role } from "@jeux/db";
import { loginSchema } from "./validators";
import { login as apiLogin } from "./reliques-api";
import { mirrorApiUser } from "./user-mirror";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // 1. Auth via l'API partenaire (source de vérité des comptes joueurs).
        let apiOk = false;
        try {
          await apiLogin(email, password);
          apiOk = true;
        } catch {
          apiOk = false;
        }
        if (apiOk) {
          const u = await mirrorApiUser({ email });
          return { id: u.id, email: u.email, name: u.name, username: u.username, role: u.role };
        }

        // 2. Repli local : comptes admin/seed absents de l'API.
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});
