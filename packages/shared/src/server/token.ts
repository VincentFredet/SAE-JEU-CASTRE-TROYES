import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export interface SocketTokenPayload {
  userId: string;
  username: string;
}

const payloadSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  exp: z.number(),
});

export function signSocketToken(
  payload: SocketTokenPayload,
  secret: string,
  ttlSeconds = 300,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySocketToken(token: string, secret: string): SocketTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success || parsed.data.exp * 1000 < Date.now()) return null;
  return { userId: parsed.data.userId, username: parsed.data.username };
}
