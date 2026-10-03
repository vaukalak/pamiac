import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { devMagicLinkVisible } from "./dev-magic-link.ts";

const route = readFileSync(new URL("../app/api/dev/magic-link/route.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);

const originalNodeEnv = process.env.NODE_ENV;
const originalVercelEnv = process.env.VERCEL_ENV;
const originalResendKey = process.env.RESEND_API_KEY;
const originalLocalFlag = process.env.PAMIAC_DEV_MAGIC_LINK;
const originalCursorAgent = process.env.CURSOR_AGENT;

function restore(
  name: "NODE_ENV" | "VERCEL_ENV" | "RESEND_API_KEY" | "PAMIAC_DEV_MAGIC_LINK" | "CURSOR_AGENT",
  value: string | undefined,
) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function restoreEnv() {
  restore("NODE_ENV", originalNodeEnv);
  restore("VERCEL_ENV", originalVercelEnv);
  restore("RESEND_API_KEY", originalResendKey);
  restore("PAMIAC_DEV_MAGIC_LINK", originalLocalFlag);
  restore("CURSOR_AGENT", originalCursorAgent);
}

function clearGates() {
  process.env.NODE_ENV = "development";
  delete process.env.VERCEL_ENV;
  delete process.env.RESEND_API_KEY;
  delete process.env.PAMIAC_DEV_MAGIC_LINK;
  delete process.env.CURSOR_AGENT;
}

afterEach(() => {
  restoreEnv();
});

describe("dev magic link gate", () => {
  it("shows the link when the local flag is on", () => {
    clearGates();
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    assert.equal(devMagicLinkVisible(), true);
  });

  it("shows the link when CURSOR_AGENT is 1", () => {
    clearGates();
    process.env.CURSOR_AGENT = "1";
    assert.equal(devMagicLinkVisible(), true);
  });

  it("hides the link when neither flag is set", () => {
    clearGates();
    assert.equal(devMagicLinkVisible(), false);
  });

  it("hides the link when the local flag is empty or zero", () => {
    clearGates();
    process.env.PAMIAC_DEV_MAGIC_LINK = "";
    assert.equal(devMagicLinkVisible(), false);
    process.env.PAMIAC_DEV_MAGIC_LINK = "0";
    assert.equal(devMagicLinkVisible(), false);
  });

  it("hides the link when CURSOR_AGENT is set to something other than 1", () => {
    clearGates();
    process.env.CURSOR_AGENT = "0";
    assert.equal(devMagicLinkVisible(), false);
    process.env.CURSOR_AGENT = "true";
    assert.equal(devMagicLinkVisible(), false);
  });

  it("shows the link for a preview deploy when the local flag is on", () => {
    clearGates();
    delete process.env.NODE_ENV;
    process.env.VERCEL_ENV = "preview";
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    assert.equal(devMagicLinkVisible(), true);
  });

  it("treats an empty RESEND_API_KEY as email not configured", () => {
    clearGates();
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    process.env.RESEND_API_KEY = "";
    assert.equal(devMagicLinkVisible(), true);
  });

  it("hides the link in production even when both flags are set", () => {
    clearGates();
    process.env.NODE_ENV = "production";
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    process.env.CURSOR_AGENT = "1";
    assert.equal(devMagicLinkVisible(), false);
  });

  it("hides the link when VERCEL_ENV is production even when both flags are set", () => {
    clearGates();
    process.env.NODE_ENV = "development";
    process.env.VERCEL_ENV = "production";
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    process.env.CURSOR_AGENT = "1";
    assert.equal(devMagicLinkVisible(), false);
  });

  it("hides the link when RESEND_API_KEY is set", () => {
    clearGates();
    process.env.PAMIAC_DEV_MAGIC_LINK = "1";
    process.env.RESEND_API_KEY = "re_test";
    assert.equal(devMagicLinkVisible(), false);
  });

  it("returns 404 from the shared helper before any database read", () => {
    const gate = route.indexOf("if (!devMagicLinkVisible())");
    const read = route.indexOf("getDb()");
    assert.ok(gate >= 0);
    assert.ok(read > gate);
    assert.match(route, /return json\(\{ error: "Not found" \}, 404\)/);
  });

  it("passes the server gate into the form and fetches only when it is on", () => {
    assert.match(page, /const showDevLink = devMagicLinkVisible\(\)/);
    assert.match(
      page,
      /<LoginForm\s+agentConnect=\{isOAuthLoginQuery\(query\)\}\s+googleEnabled=\{googleSignInEnabled\(\)\}\s+nextPath=\{formNext\}\s+showDevLink=\{showDevLink\}\s*\/>/,
    );
    assert.doesNotMatch(page, /NEXT_PUBLIC_/);
    assert.match(
      form,
      /if \(!showDevLink\) return \{ devUrl: null \};\s*try \{\s*const dev = await fetch\(`\/api\/dev\/magic-link\?email=\$\{encodeURIComponent\(email\)\}`\)/,
    );
  });
});
