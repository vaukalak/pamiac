import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const support = readFileSync(new URL("../app/support/page.tsx", import.meta.url), "utf8");
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

describe("login desk", () => {
  it("uses the shared hero frame instead of the door scene", () => {
    const hero = block(css, ".hero {");

    expect(page).toMatch(/className="hero sign-in"/);
    expect(page).toMatch(/<LoginForm nextPath=\{formNext\} \/>/);
    expect(page).not.toMatch(/auth-wrap|auth-door|auth-ground|auth-card|<svg/);
    expect(page).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(support).toMatch(/className="hero"/);
    expect(support).not.toMatch(/auth-wrap|auth-card/);
    expect(hero).toMatch(/width:\s*min\(1120px,\s*calc\(100% - 32px\)\)/);
    expect(hero).toMatch(/margin:\s*48px auto 72px/);
    expect(hero).toMatch(/grid-template-columns:\s*1\.15fr 0\.85fr/);
    expect(css).not.toMatch(/\.auth-door|\.auth-ground/);
  });

  it("keeps the hero stack at the shared narrow breakpoint", () => {
    const narrow = block(css, "@media (max-width: 900px) {");

    expect(narrow).toMatch(/\.hero[\s\S]*grid-template-columns:\s*1fr/);
    expect(narrow).toMatch(/\.hero\s*\{[^}]*margin-top:\s*28px/);
    expect(narrow).toMatch(/\.sign-in \.feature\s*\{[^}]*grid-column:\s*auto/);
    expect(page).not.toMatch(/1120px|460px/);
    expect(support).not.toMatch(/1120px|460px/);
  });
});
