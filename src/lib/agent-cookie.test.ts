import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { agentTokenStatus, hashAgentToken, type AgentTokenRecord } from "./tokens.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const now = Date.parse("2026-06-01T00:00:00.000Z");

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toMatch(pattern: RegExp) {
      assert.match(String(actual), pattern);
    },
    toBeLessThan(expected: number) {
      assert.equal(typeof actual, "number");
      assert.equal(typeof expected, "number");
      assert.ok(Number(actual) < expected, `${String(actual)} < ${expected}`);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(String(actual), pattern);
      },
    },
  };
}

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function record(token: string, overrides: Partial<AgentTokenRecord> = {}): AgentTokenRecord {
  return {
    tokenHash: hashAgentToken(token),
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

const browse =
  "To browse the library in a browser, set a cookie on the app origin: name `pamiac_token`, value the PAMIAC_TOKEN value, path `/`. Then open `/workspace`. A document is `/d/<id>`. Do not print the token. `/workspace/tokens` still requires the magic-link session.";

describe("agent token status", () => {
  const token = "pam_library";

  it("rejects a missing or non-pam token before a row matters", () => {
    expect(agentTokenStatus("", record(token), now)).toBe("missing");
    expect(agentTokenStatus("session_cookie", record(token), now)).toBe("missing");
  });

  it("rejects a revoked, unknown, or mismatched token", () => {
    expect(agentTokenStatus(token, null, now)).toBe("invalid");
    expect(agentTokenStatus(token, record(token, { revokedAt: new Date(now) }), now)).toBe(
      "invalid",
    );
    expect(agentTokenStatus(token, record("pam_other"), now)).toBe("invalid");
  });

  it("rejects an expired token and accepts one that has not expired", () => {
    expect(agentTokenStatus(token, record(token, { expiresAt: new Date(now) }), now)).toBe(
      "expired",
    );
    expect(agentTokenStatus(token, record(token, { expiresAt: new Date(now + 1) }), now)).toBe(
      "ok",
    );
    expect(agentTokenStatus(token, record(token), now)).toBe("ok");
    expect(agentTokenStatus(`  ${token}`, record(token), now)).toBe("ok");
  });

  it("treats a revoked token as invalid even when it is also expired", () => {
    expect(
      agentTokenStatus(
        token,
        record(token, { revokedAt: new Date(now - 1), expiresAt: new Date(now - 1) }),
        now,
      ),
    ).toBe("invalid");
  });
});

describe("library cookie wiring", () => {
  it("uses the cookie only when the magic-link session is absent", () => {
    const session = read("src/lib/session.ts");
    const library = session.slice(session.indexOf("export async function getLibrarySession"));
    expect(library.indexOf("return result")).toBeLessThan(library.indexOf("agentUserFromCookie"));
    expect(library).toMatch(/if \(!user\) return result/);
    expect(library).toMatch(/status: "error" as const/);
    expect(read("src/lib/documents.ts")).toMatch(/if \(result\.status !== "ok"\) return null/);
  });

  it("shares one lookup that updates lastUsedAt for bearer and the cookie", () => {
    const documents = read("src/lib/documents.ts");
    const lookup = documents.slice(
      documents.indexOf("async function authenticateAgentToken"),
      documents.indexOf("export async function requireAgentUser"),
    );
    expect(lookup).toMatch(/agentTokenStatus\(/);
    expect(lookup).toMatch(/user\.email/);
    expect(lookup).toMatch(/lastUsedAt: new Date\(\)/);
    expect(lookup.indexOf('status !== "ok"')).toBeLessThan(lookup.indexOf("lastUsedAt"));
    expect(documents).toMatch(/requireAgentUser[\s\S]*authenticateAgentToken\(token\)/);
    expect(documents).toMatch(/agentUserFromCookie[\s\S]*authenticateAgentToken\(token\)/);
    expect(documents).toMatch(/jar\.get\(PAMIAC_TOKEN_COOKIE\)/);
    expect(documents).not.toMatch(/searchParams/);
    expect(documents).not.toMatch(/Set-Cookie/);
    expect(documents).not.toMatch(/jar\.set\(\s*PAMIAC_TOKEN_COOKIE/);
  });

  it("lets browsing pages and document APIs use the cookie, and keeps account routes on the magic link", () => {
    expect(read("src/app/workspace/page.tsx")).toMatch(/getLibrarySession\(/);
    expect(read("src/app/d/[id]/page.tsx")).toMatch(/getLibrarySession\(/);
    expect(read("src/app/d/[id]/page.tsx")).toMatch(
      /isOwner: user\?\.id === bundle\.document\.ownerId/,
    );
    expect(read("src/app/d/[id]/page.tsx")).toMatch(/canEdit=\{access\.level === "edit"\}/);
    expect(read("src/app/login/page.tsx")).toMatch(/getLibrarySession\(/);
    expect(read("src/app/login/page.tsx")).toMatch(/if \(result\.session\) redirect\(nextPath\)/);
    expect(read("src/app/workspace/page.tsx")).toMatch(
      /if \(!result\.session\) redirect\(`\/login\?next=\$\{encodeURIComponent\(nextPath\)\}`\)/,
    );
    expect(read("src/app/workspace/page.tsx")).toMatch(/workspaceInvitePath\(inviteId\)/);

    for (const path of [
      "src/app/api/documents/route.ts",
      "src/app/api/documents/[id]/route.ts",
      "src/app/api/documents/[id]/version/route.ts",
      "src/app/api/documents/[id]/share/route.ts",
    ]) {
      expect(read(path)).toMatch(/requireLibraryUser\(/);
      expect(read(path)).not.toMatch(/requireUserId\(/);
    }

    expect(read("src/app/workspace/tokens/page.tsx")).toMatch(/getSession\(/);
    expect(read("src/app/workspace/tokens/page.tsx")).not.toMatch(/getLibrarySession/);
    expect(read("src/app/profile/page.tsx")).toMatch(/getSession\(/);
    expect(read("src/app/profile/page.tsx")).not.toMatch(/getLibrarySession/);
    const tokens = read("src/app/api/tokens/route.ts");
    expect(tokens).toMatch(/requireUserId\(/);
    expect(tokens).not.toMatch(/requireLibraryUser/);
  });

  it("keeps bearer auth on the agent API and does not read the cookie there", () => {
    const documents = read("src/lib/documents.ts");
    const bearer = documents.slice(
      documents.indexOf("export async function requireAgentUser"),
      documents.indexOf("export async function agentUserFromCookie"),
    );
    expect(bearer).toMatch(/authorization/);
    expect(bearer).toMatch(/Bearer /);
    expect(bearer).not.toMatch(/PAMIAC_TOKEN_COOKIE/);
    expect(bearer).not.toMatch(/cookies\(/);
    const agent = read("src/app/api/agent/v1/route.ts");
    expect(agent).toMatch(/requireAgentUser\(request\)/);
    expect(agent).toMatch(/cookie: `[\s\S]*\$\{PAMIAC_TOKEN_COOKIE\}/);
    expect(agent).toMatch(/\/workspace/);
  });
});

describe("cookie browse contract", () => {
  it("documents the cookie in both skills, the agent catalog, the token page, and the readme", () => {
    const published = read("agent/SKILL.md");
    const cursorSkill = read(".cursor/skills/pamiac/SKILL.md");
    expect(published).toBe(cursorSkill);
    expect(published).toMatch(/name `pamiac_token`/);
    expect(published).toMatch(new RegExp(browse.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    expect(read("src/lib/documents.ts")).toMatch(
      /export const PAMIAC_TOKEN_COOKIE = "pamiac_token"/,
    );
    expect(read("src/app/api/agent/v1/route.ts")).toMatch(/\$\{PAMIAC_TOKEN_COOKIE\}/);
    const page = read("src/components/tokens/token-manager.tsx");
    const skill = page.match(/const SKILL = `([\s\S]*?)`;/)?.[1] ?? "";
    expect(skill).toMatch(/name pamiac_token/);
    expect(skill).toMatch(/\/workspace\/tokens/);
    expect(read("README.md")).toMatch(
      /The same token in a `pamiac_token` cookie opens `\/workspace` in a browser\./,
    );
    expect(read("README.md")).toMatch(
      /The skill reads `PAMIAC_TOKEN` from the agent environment\./,
    );
  });
});
