import assert from "node:assert/strict";
import test from "node:test";
import { accessTokenUserId, mcpRequestUserId } from "./mcp-user.ts";

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
