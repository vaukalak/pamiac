import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

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

describe("circuit light theme", () => {
  const css = readStylesheet();
  const entry = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const noteEditor = readFileSync(
    new URL("../components/note-editor.tsx", import.meta.url),
    "utf8",
  );
  const email = readFileSync(new URL("../emails/email-theme.ts", import.meta.url), "utf8");

  it("joins the imported partials with the paper tokens before the dark scheme", () => {
    assert.match(entry, /@import "\.\/desk-tokens\.css";/);
    assert.match(entry, /@import "\.\/base\.css";/);
    assert.match(entry, /@import "\.\/desk-features\.css";/);
    assert.match(entry, /@import "\.\/circuit-home\.css";/);
    assert.match(entry, /@import "\.\/circuit-library\.css";/);
    assert.ok(css.indexOf(":root {") >= 0);
    assert.ok(css.indexOf(":root {") < css.indexOf("@media (prefers-color-scheme: dark)"));
    assert.match(css, /--sans:\s*"Outfit",\s*"Manrope",\s*"Avenir Next",\s*sans-serif;/);
  });

  it("shares light desk tokens on home and the library, and restores the dark circuit", () => {
    const light = block(css, ".home,\n.library-shell {");
    const systemDark = block(
      css,
      ':root:not([data-theme="light"]) .home,\n  :root:not([data-theme="light"]) .library-shell {',
    );
    const explicit = block(
      css,
      'html[data-theme="dark"] .home,\nhtml[data-theme="dark"] .library-shell {',
    );

    assert.match(light, /--home-ground:\s*var\(--paper\)/);
    assert.match(light, /--home-text:\s*var\(--ink\)/);
    assert.match(light, /--home-panel:\s*color-mix\(in srgb, var\(--card\) 88%, transparent\)/);
    assert.match(light, /--home-lime:\s*var\(--teal\)/);
    assert.match(
      light,
      /--home-trace:\s*color-mix\(in srgb, var\(--teal\) 50%, var\(--ink-soft\)\)/,
    );
    assert.match(light, /--home-hair:\s*color-mix\(in srgb, var\(--teal\) 35%, var\(--line\)\)/);
    assert.match(light, /color-scheme:\s*light/);
    assert.match(systemDark, /--home-ground:\s*#07090a/);
    assert.match(systemDark, /--home-lime:\s*#b9f542/);
    assert.match(systemDark, /color-scheme:\s*dark/);
    const declarations = (source: string) =>
      source
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("--") || line.startsWith("color-scheme"))
        .join("\n");
    assert.equal(declarations(systemDark), declarations(explicit));
    assert.doesNotMatch(block(css, ".library-shell {"), /--home-ground:/);
    assert.doesNotMatch(block(css, ".home {"), /--home-ground:/);
  });

  it("lets the note editor follow the resolved scheme and keeps email on the dark circuit", () => {
    assert.match(noteEditor, /theme=\{scheme === "dark" \? "dark" : "light"\}/);
    assert.doesNotMatch(noteEditor, /libraryShell \|\| scheme === "dark"/);
    assert.match(email, /background: sharePalette\.ground/);
    assert.match(email, /accent: sharePalette\.lime/);
    assert.match(email, /surface: "#0d110e"/);
  });
});
