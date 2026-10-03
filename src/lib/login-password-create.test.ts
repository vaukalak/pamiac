import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(actual, pattern);
      },
    },
  };
}

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

describe("email and password create account", () => {
  it("checks password length and confirmation only while creating an account", () => {
    const fields = read("src/components/login/login-password-form.tsx");
    const resolve = slice(fields, "function resolvePassword", "function passwordResolver");
    const createPassword = slice(
      fields,
      "function createPasswordMessage",
      "function confirmPasswordMessage",
    );
    const signInPassword = slice(
      fields,
      "function signInPasswordMessage",
      "function createPasswordMessage",
    );

    expect(resolve).toMatch(/mode === "create"[\s\S]*createPasswordMessage/);
    expect(resolve).toMatch(/mode === "create"[\s\S]*confirmPasswordMessage/);
    expect(signInPassword).toMatch(/"Enter a password\."/);
    expect(signInPassword).not.toMatch(/MIN_PASSWORD_LENGTH|8 characters|confirmPassword/);
    expect(createPassword).toMatch(/password\.length < MIN_PASSWORD_LENGTH/);
    expect(createPassword).toMatch(/password\.length > MAX_PASSWORD_LENGTH/);
    expect(createPassword).not.toMatch(/length < 9|length < 10|length > 64/);
    expect(fields).toMatch(/const MIN_PASSWORD_LENGTH = 8;/);
    expect(fields).toMatch(/const MAX_PASSWORD_LENGTH = 128;/);
  });

  it("keeps field values in the form and submits the visible mode", () => {
    const fields = read("src/components/login/login-password-form.tsx");
    const connect = read("src/components/connect/google-connect-sign-in.tsx");
    const submit = slice(fields, "mutationFn:", "const message");

    expect(fields).toMatch(/useState<PasswordMode>\("sign-in"\)/);
    expect(fields).not.toMatch(/useState\([^)]*(email|password|confirmPassword)/);
    expect(fields).toMatch(/defaultValues: \{ email: "", password: "", confirmPassword: "" \}/);
    expect(submit).toMatch(/mode: modeRef\.current/);
    expect(fields).toMatch(/type="button"/);
    expect(fields).toMatch(/mode === "create" \? "Sign in" : "Create account"/);
    expect(fields).toMatch(/<LoginPasswordCreateFields \/>/);
    expect(connect).toMatch(/<LoginPasswordForm/);
    expect(connect).not.toMatch(/Confirm password|signUp\.email|<input/);
  });

  it("names the account from the email local part", () => {
    const fields = read("src/components/login/login-password-form.tsx");
    const name = slice(fields, "function accountName", "function resolvePassword");

    expect(name).toMatch(/email\.split\("@"\)\[0\]/);
    expect(name).toMatch(/return "User"/);
    expect(name).not.toMatch(/useState|prompt\(/);
  });
});
