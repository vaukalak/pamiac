import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

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

function openingTag(source: string, name: string) {
  const match = source.match(new RegExp(`<${name}\\b[^>]*>`));
  assert.ok(match, `<${name}>`);
  return match[0];
}

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

describe("reading faces", () => {
  it("keeps a real fallback inside each alias and resolves it on :root", () => {
    const root = block(css, ":root {");

    expect(root).toMatch(/--sans:\s*var\(--font-sans,\s*"Avenir Next",\s*sans-serif\)/);
    expect(root).toMatch(/--serif:\s*var\(--font-serif,\s*"Iowan Old Style",\s*Georgia,\s*serif\)/);
    expect(root).toMatch(/--mono:\s*var\(--font-mono,\s*ui-monospace,\s*monospace\)/);
    expect(css).not.toMatch(/--(?:sans|serif|mono):\s*var\(--font-[a-z-]+\)\s*,/);
  });

  it("loads Outfit, Fraunces, and IBM Plex Mono on the html element that :root is", () => {
    expect(layout).toMatch(/Outfit\(\{[^}]*variable:\s*"--font-sans"/);
    expect(layout).toMatch(/Fraunces\(\{[^}]*variable:\s*"--font-serif"/);
    expect(layout).toMatch(/IBM_Plex_Mono\(\{[^}]*variable:\s*"--font-mono"/);

    const html = openingTag(layout, "html");
    expect(html).toMatch(/sans\.variable/);
    expect(html).toMatch(/serif\.variable/);
    expect(html).toMatch(/mono\.variable/);
  });

  it("uses the sans alias for body copy and the serif alias for the wordmark and headings", () => {
    expect(block(css, "body {\n  min-height")).toMatch(/font-family:\s*var\(--sans\)/);
    expect(block(css, ".brand {")).toMatch(/font-family:\s*var\(--serif\)/);
    expect(block(css, "h1,\nh2,\nh3 {")).toMatch(/font-family:\s*var\(--serif\)/);
  });
});
