import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOOGLE_LOGIN_EXPIRES_SECONDS,
  GOOGLE_LOGIN_INTERVAL_SECONDS,
  createDeviceCode,
  createUserCode,
  formatUserCode,
  googleAgentConnected,
  googleAgentName,
  googleConnectPath,
  googleLoginHttpStatus,
  googleLoginPoll,
  googleTokenName,
  googleVerificationUrl,
  normalizeUserCode,
} from "./google-agent-login-code.ts";
import { hashAgentToken } from "./tokens.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const userCodePattern =
  /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("google agent login codes", () => {
  it("names the token from a trimmed agent and defaults when the name is blank", () => {
    assert.equal(googleAgentName(undefined), "agent");
    assert.equal(googleAgentName("  "), "agent");
    assert.equal(googleAgentName("  cursor  "), "cursor");
    assert.equal(googleAgentName(`  ${"a".repeat(50)}  `), "a".repeat(40));
    assert.equal(googleTokenName("cursor"), "Google · cursor");
    assert.equal(googleTokenName("agent"), "Google · agent");
  });

  it("shows an unambiguous user code and hashes only the dashed form", () => {
    assert.equal(formatUserCode("ABCD2345"), "ABCD-2345");
    assert.equal(normalizeUserCode("abcd-2345"), "ABCD-2345");
    assert.equal(normalizeUserCode("abcd2345"), "ABCD-2345");
    assert.equal(normalizeUserCode("ABCD 2345"), "ABCD-2345");
    assert.equal(normalizeUserCode("OOO-0000"), null);
    assert.equal(normalizeUserCode("IIII-LLLL"), null);
    assert.equal(normalizeUserCode("ABC"), null);
    assert.equal(normalizeUserCode("ABCD-234"), null);

    const code = createUserCode();
    assert.match(code, userCodePattern);
    assert.equal(normalizeUserCode(code), code);
    assert.notEqual(hashAgentToken(code), code);

    const deviceCode = createDeviceCode();
    assert.equal(deviceCode.length, 43);
    assert.match(deviceCode, /^[A-Za-z0-9_-]+$/);
    assert.equal(GOOGLE_LOGIN_INTERVAL_SECONDS, 3);
    assert.equal(GOOGLE_LOGIN_EXPIRES_SECONDS, 600);
  });

  it("builds the verification url from the request origin and the dashed code", () => {
    assert.equal(
      googleVerificationUrl("https://pamiac.com/", "ABCD-2345"),
      "https://pamiac.com/connect/google?user_code=ABCD-2345",
    );
    assert.equal(googleConnectPath("ABCD-2345"), "/connect/google?user_code=ABCD-2345");
  });
});

describe("google agent login poll", () => {
  const now = Date.parse("2026-10-02T12:00:00.000Z");
  const later = new Date(now + 60_000);
  const earlier = new Date(now - 1);

  it("keeps a stored token readable once, then treats a taken or expired login as expired", () => {
    assert.deepEqual(googleLoginPoll(null, now), { status: "invalid" });
    assert.equal(googleLoginHttpStatus("invalid"), 404);

    assert.deepEqual(
      googleLoginPoll(
        { deniedAt: new Date(now), expiresAt: later, userId: null, tokenSecret: null },
        now,
      ),
      { status: "denied" },
    );
    assert.equal(googleLoginHttpStatus("denied"), 403);

    assert.deepEqual(
      googleLoginPoll(
        { deniedAt: null, expiresAt: earlier, userId: "user", tokenSecret: "pam_secret" },
        now,
      ),
      { status: "ready" },
    );
    assert.equal(googleLoginHttpStatus("ready"), 200);

    assert.deepEqual(
      googleLoginPoll({ deniedAt: null, expiresAt: earlier, userId: null, tokenSecret: null }, now),
      { status: "expired" },
    );
    assert.deepEqual(
      googleLoginPoll({ deniedAt: null, expiresAt: later, userId: "user", tokenSecret: null }, now),
      { status: "expired" },
    );
    assert.equal(googleLoginHttpStatus("expired"), 410);

    assert.deepEqual(
      googleLoginPoll({ deniedAt: null, expiresAt: later, userId: null, tokenSecret: null }, now),
      { status: "pending" },
    );
    assert.equal(googleLoginHttpStatus("pending"), 200);
  });
});

describe("google agent connection status", () => {
  it("is connected only after the user is stored and the token secret is gone", () => {
    assert.equal(googleAgentConnected({ userId: "user", tokenSecret: null }), true);
    assert.equal(googleAgentConnected({ userId: "user", tokenSecret: "pam_secret" }), false);
    assert.equal(googleAgentConnected({ userId: null, tokenSecret: null }), false);
    assert.equal(googleAgentConnected({ userId: null, tokenSecret: "pam_secret" }), false);
    assert.equal(typeof googleAgentConnected({ userId: "user", tokenSecret: null }), "boolean");
    assert.equal(googleAgentConnected({ userId: "user", tokenSecret: "" }), false);
  });

  it("rejects an unknown code before it reports a connection", () => {
    const store = read("src/lib/google-agent-login.ts");
    const status = store.slice(
      store.indexOf("export async function readGoogleAgentConnection"),
      store.indexOf("export async function decideGoogleAgentLogin"),
    );
    assert.match(status, /throw new HttpError\(400, "Unknown user code"\)/);
    assert.match(status, /if \(!normalized\) throw new HttpError\(400, "Unknown user code"\)/);
    assert.match(status, /if \(!row\) throw new HttpError\(400, "Unknown user code"\)/);
    assert.doesNotMatch(status, /token:\s*row|tokenSecret: row\.tokenSecret/);
  });
});

describe("google agent login wiring", () => {
  it("stores hashes, skips bearer auth, and returns 503 when Google is off", () => {
    const store = read("src/lib/google-agent-login.ts");
    const route = read("src/app/api/agent/v1/google-login/route.ts");
    const schema = read("src/db/schema.ts");
    const migration = read("drizzle/0004_google-agent-login.sql");
    const journal = read("drizzle/meta/_journal.json");

    const inserted = store.slice(store.indexOf(".values({"), store.indexOf("expiresAt,"));
    assert.match(inserted, /deviceCodeHash: hashGoogleCode\(deviceCode\)/);
    assert.match(inserted, /userCodeHash: hashGoogleCode\(userCode\)/);
    assert.match(read("src/lib/google-agent-login-code.ts"), /return hashAgentToken\(value\)/);
    assert.doesNotMatch(inserted, /deviceCode,/);
    assert.doesNotMatch(inserted, /userCode,/);
    assert.match(store, /eq\(agentGoogleLogin\.tokenSecret, secret\)/);
    assert.match(store, /set\(\{ tokenSecret: null \}\)/);
    assert.match(
      store,
      /issueToken\(userId, googleTokenName\(row\.agentName\), null, \{ all: true \}\)/,
    );
    assert.match(store, /revokeToken\(userId, issued\.id\)/);
    assert.match(store, /deniedAt: new Date\(\)/);

    assert.match(route, /googleSignInEnabled\(\)/);
    assert.match(route, /Google sign-in is not configured/);
    assert.match(route, /503/);
    assert.match(route, /requestOrigin\(request\)/);
    assert.match(route, /corsHeaders\(\)/);
    assert.match(route, /device_code/);
    assert.doesNotMatch(route, /requireAgentUser/);

    assert.match(schema, /export const agentGoogleLogin = pgTable\("agent_google_login"/);
    assert.match(schema, /deviceCodeHash: text\("device_code_hash"\)\.notNull\(\)\.unique\(\)/);
    assert.match(schema, /userCodeHash: text\("user_code_hash"\)\.notNull\(\)\.unique\(\)/);
    assert.match(schema, /tokenSecret: text\("token_secret"\)/);
    assert.doesNotMatch(schema, /device_code"\)/);
    assert.doesNotMatch(schema, /user_code"\)/);

    assert.match(migration, /CREATE TABLE "agent_google_login"/);
    assert.match(migration, /"device_code_hash" text NOT NULL/);
    assert.match(migration, /"user_code_hash" text NOT NULL/);
    assert.match(migration, /REFERENCES "public"\."user"\("id"\)/);
    assert.doesNotMatch(migration, /"device_code" /);
    assert.match(journal, /"tag": "0004_google-agent-login"/);
  });

  it("approves from the signed-in page and offers Google without the magic link", () => {
    const page = read("src/app/connect/google/page.tsx");
    const signIn = read("src/components/connect/google-connect-sign-in.tsx");
    const decision = read("src/components/connect/google-connect-decision.tsx");
    const approved = read("src/components/connect/google-connect-approved.tsx");
    const connect = read("src/app/api/connect/google/route.ts");

    assert.match(page, /user_code/);
    assert.match(page, /getSession\(\)/);
    assert.match(page, /<Page /);
    assert.match(page, /<Section /);
    assert.match(page, /findGoogleLoginAgentName\(userCode\)/);
    assert.match(page, /<GoogleConnectDecision agentName=\{agentName\} userCode=\{userCode\} \/>/);
    assert.match(page, /<GoogleConnectSignIn userCode=\{userCode\} \/>/);
    assert.doesNotMatch(page, /LoginForm|magicLink|<main/);

    assert.match(signIn, /agentConnect/);
    assert.match(signIn, /googleConnectPath\(userCode\)/);
    assert.match(signIn, /Google sign-in is not set up/);
    assert.match(signIn, /<Paragraph>/);
    assert.doesNotMatch(signIn, /magicLink|LoginForm|<input/);

    assert.match(decision, /useMutation/);
    assert.match(decision, /mutation\.isPending/);
    assert.match(decision, /"approve"/);
    assert.match(decision, /"deny"/);
    assert.match(decision, /\/api\/connect\/google/);
    assert.match(
      decision,
      /Connect lets this agent search, read, and edit your notes and diagrams/,
    );
    assert.match(decision, /User code/);
    assert.match(decision, /Return to \$\{agentName\}/);
    assert.doesNotMatch(decision, />\s*Connect\s*</);
    assert.match(decision, />\s*Deny\s*</);
    assert.match(decision, /<Alert>/);
    assert.match(decision, /<Button/);
    assert.match(decision, /Denied\. The agent will stop\./);
    assert.match(decision, /mutation\.variables === "approve"/);
    assert.match(
      decision,
      /<GoogleConnectApproved agentName=\{agentName\} userCode=\{userCode\} \/>/,
    );
    assert.doesNotMatch(decision, /useState|useQuery|window\.close/);

    assert.match(approved, /useQuery/);
    assert.match(approved, /refetchInterval/);
    assert.match(approved, /3_000/);
    assert.match(approved, /if \(!status\.data\?\.connected\) return/);
    assert.match(approved, /window\.close\(\)/);
    assert.match(approved, /\$\{agentName\} can continue\./);
    assert.match(approved, /\/api\/connect\/google/);
    assert.doesNotMatch(approved, /useState|tokenSecret|setTimeout/);

    assert.match(connect, /export async function GET/);
    assert.match(connect, /requireUserId\(\)/);
    assert.match(connect, /readGoogleAgentConnection\(userCode\)/);
    assert.match(connect, /decideGoogleAgentLogin\(user\.id, input\.userCode, input\.decision\)/);
    assert.match(
      read("src/lib/google-agent-login.ts"),
      /return \{ connected: googleAgentConnected\(row\) \}/,
    );
    assert.doesNotMatch(connect, /requireAgentUser|tokenSecret|token:/);
  });

  it("teaches the downloaded skill the same Google flow and keeps the agent tab sentence", () => {
    const skill = read("src/components/tokens/token-skill.ts");
    const agent = read("src/components/tokens/connection-agent.tsx");
    const readme = read("README.md");
    const chatgpt = read("skills/pamiac/SKILL.md");

    assert.match(skill, /Offer sign-in with Google/);
    assert.match(skill, /POST https:\/\/pamiac\.com\/api\/agent\/v1\/google-login/);
    assert.match(skill, /device_code=<deviceCode>/);
    assert.match(skill, /Do not ask the user to paste the token/);
    assert.match(skill, /Do not invent a token/);
    assert.match(skill, /Do not ask for a Google password/);
    assert.match(
      skill,
      /If the sandbox, proxy, or safety check refuses https:\/\/pamiac\.com \(including host_not_allowed or a data-exfiltration flag\), stop/,
    );
    assert.match(
      skill,
      /Do not send that request through the browser, Chrome, a proxy, or another tool/,
    );
    assert.doesNotMatch(skill, /If PAMIAC_TOKEN is missing, say so and stop/);
    assert.doesNotMatch(skill, /pam_[A-Za-z0-9_-]{8,}/);

    assert.match(agent, /It does not\s+contain credentials\./);
    assert.match(agent, /PAMIAC_SKILL_URL/);
    assert.match(
      readme,
      /An agent without `PAMIAC_TOKEN` follows the skill and offers Google sign-in\./,
    );
    assert.doesNotMatch(chatgpt, /google-login|PAMIAC_TOKEN/);
  });
});
