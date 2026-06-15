import type { Role } from "@jeux/db";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
  }
}
