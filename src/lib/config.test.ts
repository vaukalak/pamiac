import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { appSecret } from "./config.ts";

const originalSecret = process.env.BETTER_AUTH_SECRET;
const originalNodeEnv = process.env.NODE_ENV;

function restoreEnv() {
  if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
  else process.env.BETTER_AUTH_SECRET = originalSecret;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}

afterEach(() => {
  restoreEnv();
});

describe("appSecret", () => {
  it("trims a trailing newline so the Vercel env UI does not change the secret", () => {
    process.env.BETTER_AUTH_SECRET = "production-secret\n";
    assert.equal(appSecret(), "production-secret");
  });

  it("treats a whitespace-only secret as unset", () => {
    process.env.NODE_ENV = "development";
    process.env.BETTER_AUTH_SECRET = "\n";
    assert.equal(appSecret(), "dev-only-pamiac-secret-change-me");
  });

  it("throws in production when the secret is unset", () => {
    process.env.NODE_ENV = "production";
    delete process.env.BETTER_AUTH_SECRET;
    assert.throws(() => appSecret(), /BETTER_AUTH_SECRET is required/);
  });

  it("keeps the dev fallback when the secret is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.BETTER_AUTH_SECRET;
    assert.equal(appSecret(), "dev-only-pamiac-secret-change-me");
  });
});
