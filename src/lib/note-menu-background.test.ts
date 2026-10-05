import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const css = readStylesheet();

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    toContain(value: string) {
      assert.ok(actual.includes(value), value);
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

describe("library note block menus", () => {
  it("paints the slash menu, dropdown, and drag-handle popup solid", () => {
    const menus = block(
      css,
      ".library-shell .note-editor .bn-suggestion-menu,\n.library-shell .note-editor .bn-menu-dropdown,\n.library-shell .note-editor .bn-drag-handle-menu {",
    );

    expect(menus).toMatch(/background-color:\s*var\(--home-menu\)/);
    expect(menus).toContain(".bn-suggestion-menu");
    expect(menus).toContain(".bn-menu-dropdown");
    expect(menus).toContain(".bn-drag-handle-menu");
    assert.doesNotMatch(menus, /var\(--home-panel\)/);
    assert.doesNotMatch(menus, /rgba\(/);
  });

  it("keeps the shared panel token translucent and the desk menu opaque", () => {
    const circuit = block(
      css,
      '  :root:not([data-theme="light"]) .home,\n  :root:not([data-theme="light"]) .library-shell {',
    );
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
    const desk = block(dark, ".note-editor .bn-container[data-color-scheme] {");

    expect(circuit).toMatch(/--home-panel:\s*rgba\(13,\s*17,\s*14,\s*0\.82\)/);
    expect(desk).toMatch(/--bn-colors-menu-background:\s*var\(--card\)/);
    assert.doesNotMatch(desk, /#0d110e/);
  });
});
