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

describe("login card inset", () => {
  it("keeps a 460px card with the same side inset as the header", () => {
    const card = block(css, ".auth-card {");
    const inset = block(css, ".app-header,\n.topbar,\n.workspace,\n.auth-card,");
    const chrome = block(css, ".doc-card,\n.auth-card,\n.panel,");

    expect(card).toMatch(/width:\s*min\(460px,\s*calc\(100% - 32px\)\)/);
    expect(card).not.toMatch(/width:\s*min\(460px,\s*100%\)/);
    expect(inset).toMatch(/\.app-header/);
    expect(inset).toMatch(/\.auth-card/);
    expect(inset).toMatch(/width:\s*min\(1120px,\s*calc\(100% - 32px\)\)/);
    expect(inset).toMatch(/margin:\s*0 auto/);
    expect(chrome).toMatch(/border-radius:\s*18px/);
  });
});
