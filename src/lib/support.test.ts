import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { sendMagicLink, sendSupportRequest } from "./mail.ts";
import { MAX_SUPPORT_MESSAGE, SUPPORT_INBOX, supportRequestSchema } from "./support.ts";

const originalFetch = globalThis.fetch;
const originalInfo = console.info;
const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.EMAIL_FROM;
const originalEnv = process.env.NODE_ENV;
const originalDatabase = process.env.DATABASE_URL;

function restoreEnv() {
  globalThis.fetch = originalFetch;
  console.info = originalInfo;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
  if (originalFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalFrom;
  if (originalEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnv;
  if (originalDatabase === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabase;
}

afterEach(() => {
  restoreEnv();
});

describe("support request validation", () => {
  it("trims a valid email and message", () => {
    const parsed = supportRequestSchema.parse({
      email: "  Ada@Example.com  ",
      message: "  Hello there  ",
    });
    assert.equal(parsed.email, "Ada@Example.com");
    assert.equal(parsed.message, "Hello there");
  });

  it("rejects a missing or invalid email", () => {
    const blank = supportRequestSchema.safeParse({ email: "   ", message: "Hello" });
    const invalid = supportRequestSchema.safeParse({ email: "not-an-email", message: "Hello" });
    assert.equal(blank.success, false);
    assert.equal(invalid.success, false);
    if (!blank.success) {
      assert.match(blank.error.issues[0]?.message ?? "", /email/i);
    }
    if (!invalid.success) {
      assert.match(invalid.error.issues[0]?.message ?? "", /valid email/i);
    }
  });

  it("rejects an empty message and a message past the cap", () => {
    const empty = supportRequestSchema.safeParse({ email: "ada@example.com", message: "  \n  " });
    const capped = supportRequestSchema.safeParse({
      email: "ada@example.com",
      message: "a".repeat(MAX_SUPPORT_MESSAGE + 1),
    });
    const allowed = supportRequestSchema.safeParse({
      email: "ada@example.com",
      message: "a".repeat(MAX_SUPPORT_MESSAGE),
    });
    assert.equal(empty.success, false);
    assert.equal(capped.success, false);
    assert.equal(allowed.success, true);
  });
});

describe("support email delivery", () => {
  it("addresses support@pamiac.com and replies to the visitor", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    let captured: { url: string; body: Record<string, unknown> } | null = null;
    globalThis.fetch = async (input, init) => {
      captured = {
        url: String(input),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      };
      return new Response("{}", { status: 200 });
    };

    await sendSupportRequest({
      email: " ada@example.com ",
      message: 'Help <please> & "thanks"\nNext line',
    });

    assert.ok(captured);
    const body = captured.body;
    assert.equal(captured.url, "https://api.resend.com/emails");
    assert.equal(body.to, SUPPORT_INBOX);
    assert.equal(body.to, "support@pamiac.com");
    assert.equal(body.reply_to, "ada@example.com");
    assert.notEqual(body.to, body.reply_to);
    assert.match(String(body.subject), /Pamiac support request/);
    assert.match(String(body.html), /Help &lt;please&gt; &amp; &quot;thanks&quot;/);
    assert.match(String(body.html), /<br>/);
    assert.doesNotMatch(String(body.html), /<please>/);
  });

  it("logs and succeeds without a key outside production", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "development";
    const logs: string[] = [];
    console.info = (message?: unknown) => {
      logs.push(String(message));
    };
    let fetched = false;
    globalThis.fetch = async () => {
      fetched = true;
      return new Response("{}", { status: 500 });
    };

    await sendSupportRequest({ email: "ada@example.com", message: "Hello from local" });

    assert.equal(fetched, false);
    assert.match(logs.join("\n"), /ada@example.com/);
    assert.match(logs.join("\n"), /Hello from local/);
  });

  it("fails in production when the Resend key is missing", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "production";
    await assert.rejects(
      () => sendSupportRequest({ email: "ada@example.com", message: "Hello" }),
      /RESEND_API_KEY is required to send support requests/,
    );
  });

  it("does not store a support request when the local database is unset", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "development";
    await sendSupportRequest({ email: "ada@example.com", message: "No database" });
  });

  it("reports a Resend failure and a missing sender", async () => {
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.EMAIL_FROM;
    await assert.rejects(
      () => sendSupportRequest({ email: "ada@example.com", message: "Hello" }),
      /EMAIL_FROM is required when RESEND_API_KEY is set/,
    );

    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    globalThis.fetch = async () => new Response("no", { status: 422 });
    await assert.rejects(
      () => sendSupportRequest({ email: "ada@example.com", message: "Hello" }),
      /Could not send the support request/,
    );
  });

  it("does not put a password or the visitor address in the To field", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    let body: Record<string, unknown> = {};
    globalThis.fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response("{}", { status: 200 });
    };

    await sendSupportRequest({
      email: "ada@example.com",
      message: "I cannot open a diagram",
      password: "secret-password",
    } as { email: string; message: string });

    assert.equal(body.to, "support@pamiac.com");
    assert.equal(body.reply_to, "ada@example.com");
    assert.doesNotMatch(JSON.stringify(body), /secret-password/);
  });

  it("keeps magic links addressed to the visitor without a reply-to", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    let body: Record<string, unknown> = {};
    globalThis.fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response("{}", { status: 200 });
    };

    await sendMagicLink({ email: "ada@example.com", url: "https://pamiac.test/magic" });

    assert.equal(body.to, "ada@example.com");
    assert.equal(Object.hasOwn(body, "reply_to"), false);
    assert.match(String(body.html), /https:\/\/pamiac\.test\/magic/);
  });
});
