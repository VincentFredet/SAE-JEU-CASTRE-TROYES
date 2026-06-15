import { NextResponse } from "next/server";
import { signSocketToken } from "@jeux/shared/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const token = signSocketToken(
    { userId: session.user.id, username: session.user.username },
    secret,
  );

  return NextResponse.json({ token });
}
