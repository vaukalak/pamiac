import assert from "node:assert/strict";
import test from "node:test";
import { MCP_INSTRUCTIONS, UPDATE_DIAGRAM_DESCRIPTION } from "./mcp-instructions.ts";

test("server instructions put the library rules inside the first 512 characters", () => {
  assert.ok(MCP_INSTRUCTIONS.length <= 512);
  assert.equal(
    MCP_INSTRUCTIONS.startsWith(
      "Pamiac stores the signed-in user's notes and UML diagrams. Search or list before creating a duplicate.",
    ),
    true,
  );
  assert.match(MCP_INSTRUCTIONS, /Do not ask the user for a token\.$/);
});

test("diagram updates tell the model to send a partial patch", () => {
  assert.match(
    UPDATE_DIAGRAM_DESCRIPTION,
    /call read_document in the same turn, send only changed nodes with ids from that read, omit position to keep layout/,
  );
});
