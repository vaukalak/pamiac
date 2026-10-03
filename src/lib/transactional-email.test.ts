import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { MAGIC_LINK_EXPIRES_SECONDS } from "./email-expiry.ts";
import {
  sendDocumentPermissionRequest,
  sendEmailConfirmation,
  sendMagicLink,
  sendNoteShared,
  sendPasswordReset,
  sendWorkspaceInvite,
} from "./mail.ts";

const originalFetch = globalThis.fetch;
const originalInfo = console.info;
const originalError = console.error;
const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.EMAIL_FROM;
const originalEnv = process.env.NODE_ENV;

function restore(name: "RESEND_API_KEY" | "EMAIL_FROM" | "NODE_ENV", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.info = originalInfo;
  console.error = originalError;
  restore("RESEND_API_KEY", originalKey);
  restore("EMAIL_FROM", originalFrom);
  restore("NODE_ENV", originalEnv);
});

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

async function captureSend(send: () => Promise<void>) {
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
  const logs: string[] = [];
  const errors: string[] = [];
  console.info = (message?: unknown) => {
    logs.push(String(message));
  };
  console.error = (message?: unknown) => {
    errors.push(String(message));
  };
  let body: Record<string, unknown> = {};
  let url = "";
  globalThis.fetch = async (input, init) => {
    url = String(input);
    body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ id: "msg_1" });
  };
  await send();
  return { body, url, logs, errors };
}

describe("transactional email delivery", () => {
  it("sends the magic link for 15 minutes without logging the URL", async () => {
    const secret = "https://pamiac.test/magic?token=secret-token";
    const sent = await captureSend(() => sendMagicLink({ email: "ada@example.com", url: secret }));
    const html = String(sent.body.html);
    const text = String(sent.body.text);
    const logged = sent.logs.join("\n");

    assert.equal(sent.url, "https://api.resend.com/emails");
    assert.equal(sent.body.from, "Pamiac <mail@pamiac.com>");
    assert.equal(sent.body.to, "ada@example.com");
    assert.equal(sent.body.subject, "Sign in to Pamiac");
    assert.equal(Object.hasOwn(sent.body, "reply_to"), false);
    assert.match(html, /This link will expire in 15 minutes/);
    assert.match(html, /Sign in to Pamiac →/);
    assert.match(html, /secret-token/);
    assert.match(html, /#b9f542/i);
    assert.match(html, /alt="Pamiac"/);
    assert.match(html, /\/icon\.svg/);
    assert.match(html, /Pamiac · A shared mind for you and your agents\./);
    assert.doesNotMatch(html, /var\(--/);
    assert.match(text, /15 minutes/);
    assert.match(text, /secret-token/);
    assert.match(logged, /template=magic-link/);
    assert.match(logged, /ada@example.com/);
    assert.match(logged, /id=msg_1/);
    assert.doesNotMatch(logged, /secret-token/);
    assert.equal(sent.errors.length, 0);
  });

  it("logs a confirmation without the token and skips the dev link store", async () => {
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

    await sendEmailConfirmation({
      email: "ada@example.com",
      url: "https://pamiac.test/confirm?token=confirm-secret",
    });

    assert.equal(fetched, false);
    assert.match(logs.join("\n"), /ada@example.com/);
    assert.doesNotMatch(logs.join("\n"), /confirm-secret/);
  });

  it("fails closed in production when password reset cannot be sent", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "production";
    await assert.rejects(
      () =>
        sendPasswordReset({
          email: "ada@example.com",
          url: "https://pamiac.test/reset?token=reset-secret",
        }),
      /RESEND_API_KEY is required to send password resets/,
    );
  });

  it("sends reset and confirmation text without putting the token in the log", async () => {
    const reset = await captureSend(() =>
      sendPasswordReset({
        email: "ada@example.com",
        url: "https://pamiac.test/reset?token=reset-secret",
      }),
    );
    assert.equal(reset.body.subject, "Reset your Pamiac password");
    assert.match(String(reset.body.html), /expire in 1 hour/);
    assert.match(String(reset.body.text), /reset-secret/);
    assert.match(String(reset.body.html), /Reset password →/);
    assert.doesNotMatch(reset.logs.join("\n"), /reset-secret/);

    const confirm = await captureSend(() =>
      sendEmailConfirmation({
        email: "ada@example.com",
        url: "https://pamiac.test/confirm?token=confirm-secret",
      }),
    );
    assert.equal(confirm.body.subject, "Confirm your Pamiac email");
    assert.match(String(confirm.body.html), /Confirm email →/);
    assert.match(String(confirm.body.text), /confirm-secret/);
    assert.doesNotMatch(confirm.logs.join("\n"), /confirm-secret/);
  });

  it("escapes a workspace name and keeps the inviter out of the secret URL log", async () => {
    const sent = await captureSend(() =>
      sendWorkspaceInvite({
        email: "ada@example.com",
        url: "https://pamiac.test/workspace?invite=invite-secret",
        workspaceName: 'Atlas <script> & "Q"',
        inviterName: "Grace",
      }),
    );
    const html = String(sent.body.html);
    assert.equal(sent.body.subject, 'Grace invited you to Atlas <script> & "Q"');
    assert.match(html, /Atlas &lt;script&gt;/);
    assert.match(html, /&amp;/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Accept invitation →/);
    assert.match(String(sent.body.text), /invite-secret/);
    assert.match(String(sent.body.text), /Atlas <script>/);
    assert.doesNotMatch(sent.logs.join("\n"), /invite-secret/);
    assert.doesNotMatch(html, /View workspace details/);
  });

  it("shares a note without a body excerpt and truncates an excerpt, not the title", async () => {
    const title = "T".repeat(180);
    const excerpt = "E".repeat(180);
    const sent = await captureSend(() =>
      sendNoteShared({
        email: "ada@example.com",
        url: "https://pamiac.test/d/note-1",
        senderName: "Grace <b>",
        noteTitle: title,
        noteExcerpt: excerpt,
        accountRequired: true,
      }),
    );
    const html = String(sent.body.html);
    assert.match(html, /Grace &lt;b&gt;/);
    assert.match(html, new RegExp(title));
    assert.match(html, /E{139}…/);
    assert.doesNotMatch(html, /E{140}/);
    assert.match(html, /You’ll need a Pamiac account/);
    assert.match(html, /Open note →/);
    assert.equal(sent.body.subject, `Grace <b> shared "${title}" with you`);
    assert.doesNotMatch(html, /private note body/);

    const open = await captureSend(() =>
      sendNoteShared({
        email: "ada@example.com",
        url: "https://pamiac.test/d/note-1",
        senderName: "Grace",
        noteTitle: "Roadmap",
        accountRequired: false,
      }),
    );
    assert.doesNotMatch(String(open.body.html), /You’ll need a Pamiac account/);
  });

  it("views an access request without an approve link", async () => {
    const sent = await captureSend(() =>
      sendDocumentPermissionRequest({
        email: "owner@example.com",
        requesterEmail: "ada@example.com",
        requesterName: "Ada <b>",
        documentTitle: 'Plan "A"',
        url: "https://pamiac.test/d/note-1",
      }),
    );
    const html = String(sent.body.html);
    assert.equal(sent.body.subject, 'Ada <b> requested access to "Plan "A""');
    assert.match(html, /Ada &lt;b&gt;/);
    assert.match(html, /View note/);
    assert.match(html, /https:\/\/pamiac\.test\/d\/note-1/);
    assert.doesNotMatch(html, /Approve request/);
    assert.match(String(sent.body.text), /note-1/);
    assert.doesNotMatch(sent.logs.join("\n"), /note-1/);
  });

  it("keeps approve and view as different links when an approve URL is supplied", async () => {
    const sent = await captureSend(() =>
      sendDocumentPermissionRequest({
        email: "owner@example.com",
        requesterEmail: "ada@example.com",
        documentTitle: "Plan",
        url: "https://pamiac.test/d/note-1",
        approveUrl: "https://pamiac.test/share-requests/request-1",
      }),
    );
    const html = String(sent.body.html);
    assert.match(html, /Approve request →/);
    assert.match(html, /href="https:\/\/pamiac\.test\/share-requests\/request-1"/);
    assert.match(html, /href="https:\/\/pamiac\.test\/d\/note-1"/);
  });

  it("surfaces a provider failure without the secret URL", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "Pamiac <mail@pamiac.com>";
    const errors: string[] = [];
    console.error = (message?: unknown) => {
      errors.push(String(message));
    };
    globalThis.fetch = async () =>
      Response.json({ name: "validation_error", message: "no" }, { status: 422 });

    await assert.rejects(
      () =>
        sendMagicLink({
          email: "ada@example.com",
          url: "https://pamiac.test/magic?token=secret-token",
        }),
      /Could not send the magic link email/,
    );
    assert.match(errors.join("\n"), /category=validation_error/);
    assert.doesNotMatch(errors.join("\n"), /secret-token/);
  });

  it("wires expiry and the existing auth callbacks", () => {
    const auth = read("./auth.ts");
    const people = read("./workspace-people.ts");
    const request = read("./permission-request.ts");
    const documents = read("./documents.ts");
    const update = documents.slice(
      documents.indexOf("export async function updateShare"),
      documents.indexOf("async function upsertEmbedding"),
    );

    assert.equal(MAGIC_LINK_EXPIRES_SECONDS, 15 * 60);
    assert.match(auth, /expiresIn: MAGIC_LINK_EXPIRES_SECONDS/);
    assert.match(auth, /sendResetPassword:/);
    assert.match(auth, /sendVerificationEmail:/);
    assert.match(auth, /resetPasswordTokenExpiresIn: PASSWORD_RESET_EXPIRES_SECONDS/);
    assert.doesNotMatch(auth, /requireEmailVerification:\s*true/);
    assert.match(people, /inviterName/);
    assert.doesNotMatch(request, /approveUrl/);
    assert.ok(update.indexOf("insert(documentShares)") < update.indexOf("sendNoteShared"));
    assert.match(update, /inArray\(documentShares\.email, pending\)/);
    assert.doesNotMatch(update, /current\.content/);
    assert.doesNotMatch(update, /noteExcerpt/);
  });
});
