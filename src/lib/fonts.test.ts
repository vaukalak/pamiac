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
  it("names the real faces so a missing glyph skips the metric fallback", () => {
    const root = block(css, ":root {");

    expect(root).toMatch(/--sans:\s*"Outfit",\s*"Manrope",\s*"Avenir Next",\s*sans-serif;/);
    expect(root).toMatch(
      /--serif:\s*"Fraunces",\s*"Literata",\s*"Iowan Old Style",\s*Georgia,\s*serif;/,
    );
    expect(root).toMatch(/--mono:\s*"IBM Plex Mono",\s*ui-monospace,\s*monospace;/);
    expect(css).not.toMatch(/--(?:sans|serif|mono):\s*var\(--font-[a-z-]+\)\s*,/);
    expect(root).not.toMatch(/--(?:sans|serif|mono):[^;]*Fallback/);
  });

  it("loads Outfit, Fraunces, and IBM Plex Mono on the html element that :root is", () => {
    expect(layout).toMatch(/Outfit\(\{[^}]*subsets:\s*\["latin"\][^}]*variable:\s*"--font-sans"/);
    expect(layout).toMatch(
      /Fraunces\(\{[^}]*subsets:\s*\["latin"\][^}]*variable:\s*"--font-serif"/,
    );
    expect(layout).toMatch(
      /Manrope\(\{[^}]*subsets:\s*\["cyrillic"\][^}]*variable:\s*"--font-sans-cyrillic"/,
    );
    expect(layout).toMatch(/Literata\(\{[^}]*subsets:\s*\["cyrillic"\]/);
    expect(layout).toMatch(/Literata\(\{[^}]*style:\s*\["normal",\s*"italic"\]/);
    expect(layout).toMatch(/variable:\s*"--font-serif-cyrillic"/);
    expect(layout).toMatch(
      /IBM_Plex_Mono\(\{[^}]*subsets:\s*\["latin",\s*"cyrillic"\][^}]*variable:\s*"--font-mono"/,
    );

    const html = openingTag(layout, "html");
    expect(html).toMatch(/sans\.variable/);
    expect(html).toMatch(/serif\.variable/);
    expect(html).toMatch(/mono\.variable/);
    expect(html).toMatch(/sansCyrillic\.variable/);
    expect(html).toMatch(/serifCyrillic\.variable/);
  });

  it("uses the sans alias for body copy and the serif alias for the wordmark and headings", () => {
    expect(block(css, "body {\n  min-height")).toMatch(/font-family:\s*var\(--sans\)/);
    expect(block(css, ".brand {")).toMatch(/font-family:\s*var\(--serif\)/);
    expect(block(css, "h1,\nh2,\nh3 {")).toMatch(/font-family:\s*var\(--serif\)/);
  });
});
