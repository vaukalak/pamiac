import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendPasswordReset } from "./mail.ts";

const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.EMAIL_FROM;
const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
  if (originalFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalFrom;
  if (originalEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnv;
});

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("password reset", () => {
  it("emails a link to the reset screen and stores it for one hour", () => {
    const auth = read("src/lib/auth.ts");
    const mail = read("src/lib/mail.ts");

    assert.match(auth, /sendResetPassword:\s*async \(\{ user, url \}\)/);
    assert.match(auth, /sendPasswordReset\(\{ email: user\.email, url \}\)/);
    assert.match(auth, /resetPasswordTokenExpiresIn:\s*60 \* 60/);
    assert.match(mail, /Reset your Pamiac password/);
    assert.match(mail, /It expires in 1 hour/);
    assert.match(mail, /href="\$\{safeUrl\}"/);
  });

  it("sends the reset link to the visitor", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    let body: Record<string, unknown> = {};
    globalThis.fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response("{}", { status: 200 });
    };

    const url = "https://pamiac.test/api/auth/reset-password/token?callbackURL=%2Freset-password";
    await sendPasswordReset({ email: "ada@example.com", url });

    assert.equal(body.to, "ada@example.com");
    assert.equal(body.subject, "Reset your Pamiac password");
    assert.match(
      String(body.html),
      /href="https:\/\/pamiac\.test\/api\/auth\/reset-password\/token\?callbackURL=%2Freset-password"/,
    );
  });

  it("sets the new password from the token on the reset screen", () => {
    const page = read("src/app/reset-password/page.tsx");
    const form = read("src/components/reset-password/reset-password-form.tsx");

    assert.match(page, /params\.token/);
    assert.match(page, /INVALID_TOKEN/);
    assert.match(page, /<ResetPasswordForm token=\{token\}/);
    assert.match(form, /authClient\.resetPassword\(\{/);
    assert.match(form, /newPassword: password/);
    assert.match(form, /token,/);
    assert.match(form, /autoComplete="new-password"/);
    assert.match(form, /label="New password"/);
    assert.match(form, /Use at least 8 characters/);
    assert.doesNotMatch(form, /confirm|useState|<input|<select/);
    assert.match(form, /<ResetPasswordDone \/>/);
  });

  it("does not request a reset when the address is empty or missing an @", () => {
    const fields = read("src/components/login/login-password-form.tsx");
    const sender = fields.slice(
      fields.indexOf("function sendResetEmail"),
      fields.indexOf("if (reset.isSuccess)"),
    );

    assert.match(sender, /passwordEmailMessage\(email\)/);
    assert.match(sender, /if \(emailMessage\)/);
    assert.match(sender, /return;/);
    assert.doesNotMatch(sender.slice(0, sender.indexOf("return;")), /reset\.mutate/);
    assert.match(sender, /reset\.mutate\(email\)/);
    assert.doesNotMatch(sender, /passwordFieldMessage|signIn\.email/);
  });

  it("shows the expired screen instead of the password form without a token", () => {
    const page = read("src/app/reset-password/page.tsx");
    const start = page.indexOf("expired ?");
    const branch = page.slice(start, page.indexOf("/>", start) + 2);

    assert.match(page, /token === ""/);
    assert.match(page, /error === "INVALID_TOKEN"/);
    assert.match(branch, /<ResetPasswordInvalid \/>/);
    assert.doesNotMatch(branch, /ResetPasswordForm/);
  });

  it("escapes the reset link and refuses to send without a key in production", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    let html = "";
    globalThis.fetch = async (_input, init) => {
      html = String(JSON.parse(String(init?.body)).html);
      return new Response("{}", { status: 200 });
    };

    await sendPasswordReset({
      email: "ada@example.com",
      url: "https://pamiac.test/reset?token=a&next=/workspace",
    });
    assert.match(html, /href="https:\/\/pamiac\.test\/reset\?token=a&amp;next=\/workspace"/);
    assert.doesNotMatch(html, /href="[^"]*&next=/);

    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    await assert.rejects(
      () => sendPasswordReset({ email: "ada@example.com", url: "https://pamiac.test/reset" }),
      /RESEND_API_KEY is required to send password reset emails/,
    );
  });

  it("does not claim a reset email was sent when the address may have no account", () => {
    const sent = read("src/components/login/login-password-reset-sent.tsx");

    assert.match(sent, /If an account uses \{address\}, we email a reset link\./);
    assert.doesNotMatch(sent, /We sent a reset link/);
  });
});
