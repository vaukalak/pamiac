import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { filterTokens, scopePayload, tokenStatus, type TokenLifecycle } from "./token-scope.ts";

const now = Date.parse("2026-06-01T00:00:00.000Z");

function token(overrides: Partial<TokenLifecycle> & { id?: string } = {}): TokenLifecycle & {
  id: string;
} {
  return {
    id: "key-1",
    name: "Cloud agent",
    tokenPrefix: "pam_cloud",
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("token scope behavior", () => {
  it("keeps a revoked key revoked when it is also expired", () => {
    const revoked = token({
      revokedAt: "2026-05-01T00:00:00.000Z",
      expiresAt: "2026-05-01T00:00:00.000Z",
    });
    assert.equal(tokenStatus(revoked, now), "Revoked");
    assert.equal(tokenStatus(token({ expiresAt: "2026-06-01T00:00:00.000Z" }), now), "Expired");
    assert.equal(tokenStatus(token({ expiresAt: "2026-06-02T00:00:00.000Z" }), now), "Active");
    assert.equal(tokenStatus(token(), now), "Active");
  });

  it("filters by status and by name or prefix without dropping the other keys", () => {
    const rows = [
      token({ id: "active", name: "Cloud agent", tokenPrefix: "pam_cloud" }),
      token({
        id: "expired",
        name: "Nightly",
        tokenPrefix: "pam_night",
        expiresAt: "2026-01-01T00:00:00.000Z",
      }),
      token({
        id: "revoked",
        name: "Old laptop",
        tokenPrefix: "pam_old",
        revokedAt: "2026-01-01T00:00:00.000Z",
      }),
    ];

    assert.deepEqual(
      filterTokens(rows, "", "all", now).map((row) => row.id),
      ["active", "expired", "revoked"],
    );
    assert.deepEqual(
      filterTokens(rows, "night", "all", now).map((row) => row.id),
      ["expired"],
    );
    assert.deepEqual(
      filterTokens(rows, "pam_old", "Active", now).map((row) => row.id),
      [],
    );
    assert.deepEqual(
      filterTokens(rows, "pam_cloud", "Active", now).map((row) => row.id),
      ["active"],
    );
  });

  it("does not widen a full selection into all scopes", () => {
    assert.deepEqual(scopePayload("all", { personal: true, "ws-1": true }), { all: true });
    assert.deepEqual(scopePayload("selected", { personal: true, "ws-1": true, "ws-2": false }), {
      all: false,
      workspaceIds: ["personal", "ws-1"],
    });
    assert.deepEqual(scopePayload("selected", { personal: false, "ws-1": false }), {
      all: false,
      workspaceIds: [],
    });
  });

  it("migrates old rows to a selected list and ignores stored ids when all scopes is set", () => {
    const migration = readFileSync(
      new URL("../../drizzle/0002_agent-token-scope.sql", import.meta.url),
      "utf8",
    );
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const fromRow = store.slice(
      store.indexOf("function scopeFromRow"),
      store.indexOf("async function resolveTokenScope"),
    );

    assert.equal(/all_scopes"\s*=\s*true/.test(migration), false);
    assert.match(fromRow, /if \(row\.allScopes\) return \{ allScopes: true, workspaceIds: \[\] \}/);
    assert.match(fromRow, /allScopes: false, workspaceIds: row\.workspaceIds \?\? \[\]/);
  });
});
