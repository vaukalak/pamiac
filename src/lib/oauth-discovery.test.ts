import assert from "node:assert/strict";
import test from "node:test";
import { oauthDiscoveryPaths } from "./oauth-discovery.ts";

test("chatgpt discovers oauth at the site root", () => {
  assert.deepEqual(oauthDiscoveryPaths("https://pamiac.example/api/mcp"), [
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/api/mcp",
    "/.well-known/oauth-authorization-server/api/auth",
    "/api/auth/.well-known/openid-configuration",
  ]);
});
