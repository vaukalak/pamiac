import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    toEqual(expected: unknown) {
      assert.equal(actual, expected);
    },
  };
}

describe("library mobile header", () => {
  it("keeps the desktop corner free of a second logo and a header bar", () => {
    const css = readStylesheet();
    const bar = block(css, ".library-mobile-header {", ".library-mobile-header .brand");

    expect(bar).toMatch(/background:\s*transparent/);
    expect(bar).toMatch(/border:\s*0/);
    assert.equal(/border-bottom/.test(bar), false);
    expect(css).toMatch(/\.library-mobile-header \.brand\s*\{\s*display:\s*none;/);
    assert.equal(/\.library-shell > \.profile\s*\{/.test(css), false);
    assert.equal(/\.profile\s*\{[^}]*position:\s*fixed/.test(css), false);
  });

  it("pads library content below the pinned mobile bar", () => {
    const css = readStylesheet();
    const narrow = css.slice(css.lastIndexOf("@media (max-width: 760px)"));

    expect(narrow).toMatch(/\.library-shell > \.library-main\s*\{[^}]*padding-top:\s*72px/);
  });
});
