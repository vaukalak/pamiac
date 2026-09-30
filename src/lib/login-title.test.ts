import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(actual, pattern);
      },
    },
  };
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("login title", () => {
  it("keeps the sign-in heading a calm size on the door card only", () => {
    const title = block(css, ".auth-door .auth-card h1 {");
    const shared = block(css, ".auth-card h1 {");
    const headings = block(css, "h1,\nh2,\nh3 {");

    expect(login).toMatch(/<h1>Sign in or register<\/h1>/);
    expect(title).toMatch(/font-size:\s*24px/);
    expect(title).toMatch(/line-height:\s*1\.2/);
    expect(title).not.toMatch(/font-family:/);
    expect(headings).toMatch(/font-family:\s*var\(--serif\)/);
    expect(shared).toMatch(/font-size:\s*40px/);
    expect(shared).not.toMatch(/line-height:/);
    expect(block(css, ".home-copy h1 {")).toMatch(/font-size:\s*clamp\(48px/);
    expect(block(css, ".note-title {")).toMatch(/font-size:\s*48px/);
  });
});
