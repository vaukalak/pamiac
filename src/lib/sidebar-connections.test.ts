import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  liveConnectionCount,
  tokenReachesWorkspace,
  type ScopedConnection,
} from "./sidebar-connections.ts";

function token(overrides: Partial<ScopedConnection> = {}): ScopedConnection {
  return {
    name: "Cursor",
    tokenPrefix: "pam",
    expiresAt: null,
    revokedAt: null,
    allScopes: false,
    workspaceIds: ["ws-1"],
    ...overrides,
  };
}

describe("sidebar connection counts", () => {
  it("counts live keys and skips revoked or expired ones", () => {
    const now = Date.parse("2026-10-04T00:00:00.000Z");
    const tokens = [
      token(),
      token({ revokedAt: "2026-01-01T00:00:00.000Z" }),
      token({ expiresAt: "2026-01-01T00:00:00.000Z" }),
      token({ expiresAt: "2026-12-01T00:00:00.000Z" }),
    ];

    assert.equal(liveConnectionCount(tokens, now), 2);
  });

  it("treats all-scopes and the open workspace as a connection", () => {
    const now = Date.parse("2026-10-04T00:00:00.000Z");
    const scoped = token({ workspaceIds: ["ws-1"] });
    const everywhere = token({ allScopes: true, workspaceIds: [] });
    const revoked = token({ allScopes: true, revokedAt: "2026-01-01T00:00:00.000Z" });

    assert.equal(tokenReachesWorkspace(scoped, "ws-1", now), true);
    assert.equal(tokenReachesWorkspace(scoped, "ws-2", now), false);
    assert.equal(tokenReachesWorkspace(everywhere, "personal", now), true);
    assert.equal(tokenReachesWorkspace(revoked, "personal", now), false);
  });
});

describe("sidebar information architecture", () => {
  function read(path: string) {
    return readFileSync(new URL(path, import.meta.url), "utf8");
  }

  it("separates connect agent from connections and recommends only when none exist", () => {
    const connect = read("../components/library/library-connect-agent-link.tsx");
    const connections = read("../components/library/library-connections-link.tsx");
    const library = read("../components/library/library-sidebar-library.tsx");
    const manage = read("../components/library/library-workspace-nav.tsx");
    const footer = read("../components/library/library-sidebar-footer.tsx");
    const account = read("../components/library/library-sidebar-account.tsx");

    assert.match(connect, /href="\/connect\/agent"/);
    assert.match(connect, /tokenReachesWorkspace/);
    assert.match(connect, /connections\.length/);
    assert.match(connect, /ready && !reaches && !consented/);
    assert.match(connect, /Recommended/);
    assert.match(connections, /href="\/workspace\/tokens"/);
    assert.match(connections, /liveConnectionCount/);
    assert.match(connections, /count > 0/);
    assert.match(library, /<LibraryCreate workspaceId=\{workspaceId\} \/>/);
    assert.match(manage, /Manage/);
    assert.equal(/Workspace settings|Members/.test(account + footer), false);
    assert.match(footer, /href="\/support"/);
    assert.match(account, /<ProfileMenu email=\{email\} \/>/);
  });
});
