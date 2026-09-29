import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

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

describe("wordmark keyboard focus", () => {
  it("draws the same teal outline buttons use, and only for keyboard focus", () => {
    const brand = block(css, ".brand {");
    const focus = block(css, ".brand:focus-visible {");
    const button = block(css, ".btn:focus-visible,");

    expect(focus).toMatch(/outline:\s*2px solid var\(--teal\)/);
    expect(focus).toMatch(/outline-offset:\s*2px/);
    expect(button).toMatch(/outline:\s*2px solid var\(--teal\)/);
    expect(button).toMatch(/outline-offset:\s*2px/);
    expect(brand).not.toMatch(/outline:|border:/);
    expect(css).not.toMatch(/\.brand:focus\s*[,{]/);
    expect(css).not.toMatch(
      /\.auth-door[^{]*\.brand:focus-visible|\.brand:focus-visible[^{]*\.auth-door/,
    );
  });
});
