import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createWorkspace, fetchWorkspaces } from "./library-workspaces.ts";

describe("saved workspaces", () => {
  it("loads the account's named workspaces", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json({
        workspaces: [{ id: "ws-1", name: "Atlas" }],
      });
    try {
      assert.deepEqual(await fetchWorkspaces(), [{ id: "ws-1", name: "Atlas" }]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("rejects a workspace list that is not an array", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ workspaces: null });
    try {
      await assert.rejects(fetchWorkspaces(), /Could not load workspaces/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("posts only the name and returns the saved workspace", async () => {
    const original = globalThis.fetch;
    let body = "";
    globalThis.fetch = async (_input, init) => {
      body = String(init?.body ?? "");
      return Response.json({ workspace: { id: "ws-9", name: "Atlas" } }, { status: 201 });
    };
    try {
      assert.deepEqual(await createWorkspace("Atlas"), { id: "ws-9", name: "Atlas" });
      assert.deepEqual(JSON.parse(body), { name: "Atlas" });
      assert.equal(Object.hasOwn(JSON.parse(body) as object, "documents"), false);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("shows the server refusal when a workspace cannot be created", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ error: "Name the workspace" }, { status: 400 });
    try {
      await assert.rejects(createWorkspace("   "), /Name the workspace/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("stores a member row for the creator and no invite route", () => {
    const store = readFileSync(new URL("./workspaces.ts", import.meta.url), "utf8");
    const route = readFileSync(new URL("../app/api/workspaces/route.ts", import.meta.url), "utf8");
    assert.match(store, /firstMember/);
    assert.match(store, /workspaceMembers/);
    assert.equal(/invite/i.test(store), false);
    assert.equal(/invite/i.test(route), false);
    assert.equal(/documents/i.test(store), false);
  });
});
