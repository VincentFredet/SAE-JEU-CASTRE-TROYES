import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./validators";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "user@example.com",
    username: "player_1",
    password: "password1",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a username at the minimum and maximum length", () => {
    expect(registerSchema.safeParse({ ...valid, username: "abc" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, username: "a".repeat(20) }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });

  it("rejects a username longer than 20 characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "a".repeat(21) }).success).toBe(false);
  });

  it("rejects usernames with spaces or symbols", () => {
    expect(registerSchema.safeParse({ ...valid, username: "has space" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "has/slash" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "at@sign" }).success).toBe(false);
  });

  it("accepts accents, dots, underscores and hyphens", () => {
    expect(registerSchema.safeParse({ ...valid, username: "has-dash" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, username: "accentué" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, username: "dot.name_1" }).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });

  it("rejects a password longer than 72 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
  });

  it("accepts a password at the 72 character boundary", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });
});
