import { NextResponse } from "next/server";
import { signSocketToken } from "@jeux/shared/server";
import { auth } from "@/lib/auth";
import { isValidGuestName } from "@/lib/guest";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const session = await auth();
  if (session?.user) {
    const token = signSocketToken(
      { userId: session.user.id, username: session.user.username },
      secret,
    );
    return NextResponse.json({ token });
  }

  // Jeu en invité : pseudo temporaire. L'identité est préfixée "guest:" pour ne
  // jamais entrer en collision avec un vrai userId — et le serveur temps réel
  // n'enregistre pas de score pour ces identités.
  const url = new URL(req.url);
  const name = (url.searchParams.get("guest") ?? "").trim();
  const gid = (url.searchParams.get("gid") ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);
  if (gid.length >= 8 && isValidGuestName(name)) {
    const token = signSocketToken({ userId: `guest:${gid}`, username: name }, secret);
    return NextResponse.json({ token });
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
