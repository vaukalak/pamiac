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
  it("uses the shared hero heading and leaves the auth card title at 40px", () => {
    const shared = block(css, ".auth-card h1 {");
    const headings = block(css, "h1,\nh2,\nh3 {");
    const hero = block(css, ".hero h1 {");

    expect(login).toMatch(/title="Sign in or register"/);
    expect(css).not.toMatch(/\.auth-door \.auth-card h1/);
    expect(hero).toMatch(/font-size:\s*clamp\(46px/);
    expect(hero).not.toMatch(/font-family:/);
    expect(headings).toMatch(/font-family:\s*var\(--serif\)/);
    expect(shared).toMatch(/font-size:\s*40px/);
    expect(shared).not.toMatch(/line-height:/);
    expect(block(css, ".note-title {")).toMatch(/font-size:\s*48px/);
  });
});
