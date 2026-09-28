import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, signUnlock, unlockMatches, verifyPassword } from "./passwords.ts";

test("password hash verifies and rejects a wrong password", () => {
  const stored = hashPassword("correct horse");
  assert.equal(verifyPassword("correct horse", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
});

test("unlock cookie is bound to the current password hash", () => {
  const secret = "test-secret";
  const hash = hashPassword("diagram");
  const cookie = signUnlock("doc-1", hash, secret);
  assert.equal(unlockMatches(cookie, "doc-1", hash, secret), true);
  assert.equal(unlockMatches(cookie, "doc-2", hash, secret), false);
  assert.equal(unlockMatches(cookie, "doc-1", hashPassword("diagram"), secret), false);
});
