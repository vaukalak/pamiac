import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  agentName,
  claimResult,
  connectExpiresAt,
  connectUrl,
  createConnectId,
  type ConnectSnapshot,
} from "./agent-connect.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const now = new Date("2026-06-01T00:00:00.000Z");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function snapshot(input: Partial<ConnectSnapshot> & { expiresAt: Date }): ConnectSnapshot {
  return {
    secret: input.secret ?? null,
    claimedAt: input.claimedAt ?? null,
    expiresAt: input.expiresAt,
  };
}

test("createConnectId is a one-time con_ id with 32 bytes of base64url", () => {
  const id = createConnectId();
  assert.match(id, /^con_[A-Za-z0-9_-]{43}$/);
  assert.notEqual(createConnectId(), id);
});

test("connectExpiresAt is fifteen minutes after now", () => {
  assert.equal(connectExpiresAt(now).toISOString(), "2026-06-01T00:15:00.000Z");
  assert.equal(now.toISOString(), "2026-06-01T00:00:00.000Z");
});

test("agentName trims, limits length, and rejects control characters", () => {
  assert.equal(agentName("  Cursor  "), "Cursor");
  assert.equal(agentName("a".repeat(80)), "a".repeat(80));
  assert.throws(() => agentName("   "), /1 and 80/);
  assert.throws(() => agentName("a".repeat(81)), /1 and 80/);
  assert.throws(() => agentName("bad\u0000name"), /control characters/);
  assert.throws(() => agentName("bad\u007fname"), /control characters/);
});

test("connectUrl uses the app origin and ignores any caller origin", () => {
  const previous = process.env.BETTER_AUTH_URL;
  process.env.BETTER_AUTH_URL = "https://pamiac.com/";
  try {
    assert.equal(connectUrl.length, 1);
    assert.equal(connectUrl("con_abc"), "https://pamiac.com/connect/con_abc");
  } finally {
    if (previous === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = previous;
  }
});

test("claimResult is ready only while the secret is unclaimed and unexpired", () => {
  const future = new Date(now.getTime() + 1000);
  const past = new Date(now.getTime() - 1);
  assert.equal(claimResult(snapshot({ secret: "pam_secret", expiresAt: future }), now), "ready");
  assert.equal(claimResult(snapshot({ secret: null, expiresAt: future }), now), "pending");
  assert.equal(claimResult(snapshot({ secret: "", expiresAt: future }), now), "pending");
  assert.equal(claimResult(snapshot({ secret: "pam_secret", expiresAt: now }), now), "expired");
  assert.equal(claimResult(snapshot({ secret: "pam_secret", expiresAt: past }), now), "expired");
  assert.equal(claimResult(snapshot({ secret: null, expiresAt: past }), now), "expired");
  assert.equal(
    claimResult(snapshot({ secret: "pam_secret", claimedAt: now, expiresAt: future }), now),
    "consumed",
  );
  assert.equal(
    claimResult(snapshot({ secret: null, claimedAt: now, expiresAt: past }), now),
    "consumed",
  );
});

test("creating a connect link does not require a session and rejects a bad name with 400", () => {
  const route = read("src/app/api/agent/v1/connect/route.ts");
  const db = read("src/lib/agent-connect-db.ts");
  assert.doesNotMatch(route, /requireUserId|requireAgentUser/);
  assert.match(route, /agentJson\(created, 201\)/);
  assert.match(db, /throw new HttpError\(400, message\)/);
  assert.match(db, /connectUrl\(id\)/);
  assert.doesNotMatch(route, /token/);
});

test("claim returns the token once from the locked row and a lost race is consumed", () => {
  const route = read("src/app/api/agent/v1/connect/[id]/route.ts");
  const db = read("src/lib/agent-connect-db.ts");
  assert.doesNotMatch(route, /requireUserId|requireAgentUser/);
  assert.match(db, /if \(!row\) throw new HttpError\(404, "Connect link not found"\)/);
  assert.match(db, /if \(status !== "ready"\) return \{ status \}/);
  assert.match(db, /if \(!token\) return \{ status: "consumed" \}/);
  assert.match(db, /return \{ status: "ready", token \}/);
  assert.match(db, /AND "secret" IS NOT NULL/);
  assert.match(db, /AND "claimed_at" IS NULL/);
  assert.match(db, /AND "expires_at" > \$\{now\}/);
  assert.match(db, /SET "secret" = NULL, "claimed_at" = \$\{now\}/);
  assert.match(db, /FOR UPDATE/);
  assert.match(db, /RETURNING locked\."secret" AS "token"/);
});

test("return mints a thirty-day all-scope key and does not echo the token", () => {
  const route = read("src/app/api/agent/v1/connect/[id]/return/route.ts");
  const db = read("src/lib/agent-connect-db.ts");
  assert.match(route, /requireUserId\(\)/);
  assert.match(route, /json\(\{ status: result\.status, agentName: result\.agentName \}\)/);
  assert.doesNotMatch(route, /token/);
  assert.match(
    db,
    /issueToken\(userId, row\.agentName, new Date\(now\.getTime\(\) \+ TOKEN_TTL_MS\), \{/,
  );
  assert.match(db, /all: true/);
  assert.match(db, /const TOKEN_TTL_MS = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(db, /isNull\(agentConnect\.secret\)/);
  assert.match(db, /isNull\(agentConnect\.claimedAt\)/);
  assert.match(db, /gt\(agentConnect\.expiresAt, now\)/);
  assert.match(db, /throw new HttpError\(404, "This link has expired"\)/);
  assert.match(db, /throw new HttpError\(409, "This link was already used"\)/);
  assert.match(db, /revokeToken\(userId, issued\.id\)/);
});

test("the connect page sends a signed-out user to login and never renders a token", () => {
  const page = read("src/app/connect/[id]/page.tsx");
  const offer = read("src/components/connect/connect-return-offer.tsx");
  const returned = read("src/components/connect/connect-returned.tsx");
  assert.match(page, /getSession\(\)/);
  assert.match(page, /status === "setup"/);
  assert.match(page, /SetupScreen detail=\{result\.message\}/);
  assert.match(
    page,
    /redirect\(`\/login\?next=\$\{encodeURIComponent\(`\/connect\/\$\{id\}`\)\}`\)/,
  );
  assert.match(offer, /useMutation/);
  assert.doesNotMatch(offer, /useState/);
  assert.match(offer, /disabled=\{mutation\.isPending\}/);
  assert.match(offer, /Return to \$\{agentName\}/);
  assert.match(offer, /Authorizing gives \{agentName\} this account's notes and diagrams\./);
  assert.match(returned, /The agent can continue\./);
  assert.doesNotMatch(`${page}\n${offer}\n${returned}`, /pam_|PAMIAC_TOKEN|secret/);
});

test("the ChatGPT skill and the Google consent copy stay off this handoff", () => {
  const mcp = read("skills/pamiac/SKILL.md");
  const login = read("src/app/login/page.tsx");
  const google = read("src/components/login/login-google.tsx");
  assert.doesNotMatch(mcp, /\/api\/agent\/v1\/connect|PAMIAC_TOKEN/);
  assert.match(login, /agentConnect=\{isOAuthLoginQuery\(query\)\}/);
  assert.doesNotMatch(google, /PAMIAC_TOKEN|\/api\/agent\/v1\/connect/);
});

test("agent_connect stores the secret only until claim", () => {
  const schema = read("src/db/schema.ts");
  const sql = read("drizzle/0004_agent-connect.sql");
  const journal = read("drizzle/meta/_journal.json");
  const table = schema.match(/export const agentConnect = pgTable\([\s\S]*?\n\);/)?.[0] ?? "";
  assert.match(table, /id: text\("id"\)\.primaryKey\(\)/);
  assert.match(table, /agentName: text\("agent_name"\)\.notNull\(\)/);
  assert.match(
    table,
    /userId: text\("user_id"\)\.references\(\(\) => user\.id, \{ onDelete: "cascade" \}\)/,
  );
  assert.match(table, /tokenId: text\("token_id"\)\.references\(\(\) => agentTokens\.id/);
  assert.match(table, /secret: text\("secret"\)/);
  assert.match(table, /claimedAt: timestamp\("claimed_at", \{ withTimezone: true \}\)/);
  assert.match(table, /index\("agent_connect_expires_at_idx"\)\.on\(table\.expiresAt\)/);
  assert.match(sql, /CREATE TABLE "agent_connect"/);
  assert.match(sql, /CREATE INDEX "agent_connect_expires_at_idx"/);
  assert.match(journal, /"idx": 4/);
  assert.match(journal, /"tag": "0004_agent-connect"/);
});
