import assert from "node:assert/strict";
import test from "node:test";
import { mcpResourceUrl } from "./mcp-resource.ts";

test("resource url strips a trailing slash and appends /api/mcp", () => {
  assert.equal(mcpResourceUrl("https://pamiac.example"), "https://pamiac.example/api/mcp");
  assert.equal(mcpResourceUrl("https://pamiac.example/"), "https://pamiac.example/api/mcp");
  assert.equal(mcpResourceUrl("http://localhost:3000///"), "http://localhost:3000/api/mcp");
});
