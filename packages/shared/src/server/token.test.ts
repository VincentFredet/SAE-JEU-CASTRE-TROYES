import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { signSocketToken, verifySocketToken } from "./token";

const SECRET = "super-secret-key";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function forgeToken(rawPayload: unknown, secret: string): string {
  const body = Buffer.from(JSON.stringify(rawPayload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

describe("signSocketToken / verifySocketToken", () => {
  it("round-trips userId and username", () => {
    const token = signSocketToken({ userId: "u1", username: "Alice" }, SECRET);
    const result = verifySocketToken(token, SECRET);
    expect(result).toEqual({ userId: "u1", username: "Alice" });
  });

  it("returns null when the verifying secret is wrong", () => {
    const token = signSocketToken({ userId: "u1", username: "Alice" }, SECRET);
    expect(verifySocketToken(token, "other-secret")).toBeNull();
  });

  it("returns null when the body is tampered while keeping the original signature", () => {
    const token = signSocketToken({ userId: "u1", username: "Alice" }, SECRET);
    const sig = token.split(".")[1]!;
    const forgedBody = Buffer.from(
      JSON.stringify({ userId: "admin", username: "Mallory", exp: Math.floor(Date.now() / 1000) + 300 }),
    ).toString("base64url");
    const forged = `${forgedBody}.${sig}`;

    expect(verifySocketToken(forged, SECRET)).toBeNull();
  });

  it("returns null for a token without a separator dot", () => {
    expect(verifySocketToken("not-a-token", SECRET)).toBeNull();
  });

  it("returns null for an empty token", () => {
    expect(verifySocketToken("", SECRET)).toBeNull();
  });

  it("returns null for a token with too many parts", () => {
    const token = signSocketToken({ userId: "u1", username: "Alice" }, SECRET);
    expect(verifySocketToken(`${token}.extra`, SECRET)).toBeNull();
  });

  it("returns null for an expired token signed with the correct secret", () => {
    const token = signSocketToken({ userId: "u1", username: "Alice" }, SECRET, -10);
    // signature is valid, but exp is in the past
    const sig = token.split(".")[1]!;
    const body = token.split(".")[0]!;
    expect(sign(body, SECRET)).toBe(sig); // confirm the signature is genuine
    expect(verifySocketToken(token, SECRET)).toBeNull();
  });

  it("rejects a correctly signed token whose payload is missing fields", () => {
    const expFuture = Math.floor(Date.now() / 1000) + 300;
    const missingUsername = forgeToken({ userId: "u1", exp: expFuture }, SECRET);
    const missingExp = forgeToken({ userId: "u1", username: "Alice" }, SECRET);

    expect(verifySocketToken(missingUsername, SECRET)).toBeNull();
    expect(verifySocketToken(missingExp, SECRET)).toBeNull();
  });

  it("rejects a correctly signed token with empty userId or username", () => {
    const expFuture = Math.floor(Date.now() / 1000) + 300;
    const emptyUserId = forgeToken({ userId: "", username: "Alice", exp: expFuture }, SECRET);
    const emptyUsername = forgeToken({ userId: "u1", username: "", exp: expFuture }, SECRET);

    expect(verifySocketToken(emptyUserId, SECRET)).toBeNull();
    expect(verifySocketToken(emptyUsername, SECRET)).toBeNull();
  });

  it("rejects a correctly signed token whose body is not valid JSON", () => {
    const body = Buffer.from("this is not json").toString("base64url");
    const forged = `${body}.${sign(body, SECRET)}`;
    expect(verifySocketToken(forged, SECRET)).toBeNull();
  });

  it("accepts a token that is still within its ttl", () => {
    const token = signSocketToken({ userId: "u9", username: "Bob" }, SECRET, 60);
    expect(verifySocketToken(token, SECRET)).toEqual({ userId: "u9", username: "Bob" });
  });
});
