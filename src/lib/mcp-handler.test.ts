import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../app/api/mcp/route.ts", import.meta.url), "utf8");

function createMcpHandlerCall(source: string) {
  const marker = "createMcpHandler(";
  const start = source.indexOf(marker);
  assert.ok(start >= 0);
  let depth = 0;
  for (let index = start + marker.length - 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  assert.fail("unterminated createMcpHandler call");
}

function argumentCount(call: string) {
  const inner = call.slice(call.indexOf("(") + 1, -1);
  let count = 0;
  let current = "";
  let paren = 0;
  let brace = 0;
  let bracket = 0;
  const push = () => {
    if (current.trim()) count += 1;
    current = "";
  };
  for (const char of inner) {
    if (char === "(") paren += 1;
    else if (char === ")") paren -= 1;
    else if (char === "{") brace += 1;
    else if (char === "}") brace -= 1;
    else if (char === "[") bracket += 1;
    else if (char === "]") bracket -= 1;
    else if (char === "," && paren === 0 && brace === 0 && bracket === 0) {
      push();
      continue;
    }
    current += char;
  }
  push();
  return count;
}

test("createMcpHandler is called without a legacy option", () => {
  const call = createMcpHandlerCall(route);
  assert.equal(argumentCount(call), 1);
  assert.match(call, /createMcpHandler\(\s*\(ctx\)\s*=>/);
  assert.doesNotMatch(call, /\blegacy\b/);
  assert.doesNotMatch(route, /legacy:\s*"reject"/);
});
