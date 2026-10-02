import assert from "node:assert/strict";
import test from "node:test";
import { accessTokenUserId, mcpRequestScope, mcpRequestUserId } from "./mcp-user.ts";

test("access token user id is the sub claim", () => {
  assert.equal(accessTokenUserId({ sub: " user-1 " }), "user-1");
  assert.equal(accessTokenUserId({ sub: "" }), "");
  assert.equal(accessTokenUserId({}), "");
  assert.equal(accessTokenUserId({ userId: "other-user" } as { sub?: unknown }), "");
});

test("request user id comes from auth info, not a lookalike claim", () => {
  assert.equal(mcpRequestUserId({ extra: { userId: " user-1 " } }), "user-1");
  assert.equal(mcpRequestUserId({ extra: { sub: "other-user" } }), "");
  assert.equal(mcpRequestUserId(undefined), "");
});

test("request scope is the agent scope object, otherwise every workspace", () => {
  assert.deepEqual(
    mcpRequestScope({ extra: { scope: { allScopes: false, workspaceIds: ["personal"] } } }),
    { allScopes: false, workspaceIds: ["personal"] },
  );
  assert.deepEqual(mcpRequestScope({ extra: { scope: { allScopes: true, workspaceIds: [] } } }), {
    allScopes: true,
    workspaceIds: [],
  });
  assert.deepEqual(mcpRequestScope(undefined), { allScopes: true, workspaceIds: [] });
  assert.deepEqual(mcpRequestScope({ extra: { userId: "user-1" } }), {
    allScopes: true,
    workspaceIds: [],
  });
  assert.deepEqual(mcpRequestScope({ extra: { scope: { allScopes: "yes", workspaceIds: [] } } }), {
    allScopes: true,
    workspaceIds: [],
  });
  assert.deepEqual(mcpRequestScope({ extra: { scope: { allScopes: false, workspaceIds: [1] } } }), {
    allScopes: true,
    workspaceIds: [],
  });
  assert.deepEqual(mcpRequestScope({ extra: { scope: { allScopes: false } } }), {
    allScopes: true,
    workspaceIds: [],
  });
  assert.deepEqual(
    mcpRequestScope({ extra: { scope: { allScopes: false, workspaceIds: "personal" } } }),
    { allScopes: true, workspaceIds: [] },
  );
  assert.deepEqual(mcpRequestScope({ extra: { scope: ["personal"] } }), {
    allScopes: true,
    workspaceIds: [],
  });
});
