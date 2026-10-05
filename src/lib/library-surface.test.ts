import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
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

describe("library shell writing surfaces", () => {
  const css = readStylesheet();
  const noteEditor = read("../components/note-editor.tsx");
  const noteDocument = read("../components/document/note-document.tsx");
  const canvas = read("../components/diagram/uml-canvas.tsx");
  const light = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"));

  it("keeps the paper note sheet and canvas outside the library shell", () => {
    const sheet = block(css, "\n.note-sheet {");
    const wrap = block(css, "\n.canvas-wrap {");
    const card = block(css, "\n.uml-card {");

    assert.match(sheet, /background:\s*var\(--card\)/);
    assert.match(wrap, /var\(--canvas\)/);
    assert.match(light, /--canvas:\s*#fbf8f2/);
    assert.match(light, /--uml-fill:\s*#fffdf8/);
    assert.match(light, /--uml-note:\s*#f6e7b8/);
    assert.match(card, /box-shadow:\s*3px 3px 0 var\(--uml-ink\)/);
    assert.doesNotMatch(sheet, /--home-text/);
  });

  it("paints the note body with the circuit palette and forces BlockNote dark only in the shell", () => {
    const sheet = block(css, ".library-shell .note-sheet {");
    const colors = block(css, ".library-shell .note-editor .bn-container[data-color-scheme] {");

    assert.match(
      sheet,
      /background:\s*color-mix\(in srgb, var\(--home-ground\) 72%, var\(--home-ink\)\)/,
    );
    assert.match(sheet, /border:\s*1px solid var\(--home-hair\)/);
    assert.match(sheet, /color:\s*var\(--home-text\)/);
    assert.match(sheet, /caret-color:\s*var\(--home-lime\)/);
    assert.doesNotMatch(sheet, /var\(--card\)|var\(--ink\)/);
    assert.match(colors, /--bn-colors-editor-text:\s*var\(--home-text\)/);
    assert.match(colors, /--bn-colors-menu-background:\s*var\(--home-menu\)/);
    assert.match(colors, /--bn-colors-tooltip-background:\s*var\(--home-panel\)/);
    assert.match(colors, /--bn-colors-hovered-text:\s*var\(--home-text\)/);
    assert.match(colors, /--bn-colors-selected-background:\s*var\(--home-lime\)/);
    assert.match(colors, /--bn-colors-selected-text:\s*var\(--home-on-lime\)/);
    assert.match(colors, /--bn-colors-side-menu:\s*var\(--home-soft\)/);
    assert.match(colors, /--bn-colors-border:\s*var\(--home-hair\)/);
    assert.match(
      css,
      /\.library-shell \.note-sheet ::selection\s*\{[^}]*background:\s*var\(--home-lime\)/,
    );
    assert.match(noteEditor, /libraryShell\?: boolean/);
    assert.match(noteEditor, /theme=\{scheme === "dark" \? "dark" : "light"\}/);
    assert.doesNotMatch(noteEditor, /libraryShell \|\| scheme === "dark"/);
    assert.match(noteEditor, /useResolvedScheme/);
    assert.match(noteDocument, /libraryShell/);
    assert.match(
      css,
      /\.library-shell \.note-editor \.bn-inline-content::before\s*\{[^}]*color:\s*var\(--home-soft\)/,
    );
    assert.doesNotMatch(css, /padding-inline:\s*54px/);
  });

  it("paints the diagram canvas, nodes, controls, and minimap inside the shell only", () => {
    const wrap = block(css, ".library-shell .canvas-wrap {");
    const card = block(css, ".library-shell .uml-card {");
    const selected = block(css, ".library-shell .uml-card.is-selected {");
    const note = block(css, ".library-shell .uml-card.kind-note {");
    const flow = block(css, ".library-shell .react-flow {");
    const fields = block(css, ".library-shell .inspector input,");

    assert.match(wrap, /--canvas:\s*var\(--home-ground\)/);
    assert.match(
      wrap,
      /--canvas-grid:\s*color-mix\(in srgb, var\(--home-lime\) 16%, transparent\)/,
    );
    assert.match(wrap, /--uml-ink:\s*var\(--home-text\)/);
    assert.match(wrap, /--uml-note:\s*var\(--home-note\)/);
    assert.match(wrap, /box-shadow:\s*none/);
    assert.match(card, /box-shadow:\s*none/);
    assert.match(card, /border:\s*1px solid var\(--home-hair\)/);
    assert.match(selected, /border-color:\s*var\(--home-lime\)/);
    assert.doesNotMatch(selected, /3px 3px 0/);
    assert.match(note, /background:\s*var\(--uml-note\)/);
    assert.match(note, /box-shadow:\s*none/);
    assert.doesNotMatch(note, /#f6e7b8/);
    assert.match(css, /\.library-shell \.canvas-empty\s*\{[^}]*color:\s*var\(--home-soft\)/);
    assert.match(flow, /--xy-minimap-background-color:\s*var\(--home-minimap\)/);
    assert.match(flow, /--xy-controls-button-background-color:\s*var\(--home-ink\)/);
    assert.match(flow, /--xy-controls-button-color:\s*var\(--home-text\)/);
    assert.match(flow, /--xy-connectionline-stroke:\s*var\(--home-lime\)/);
    assert.match(fields, /border:\s*1px solid var\(--home-hair\)/);
    assert.match(fields, /color:\s*var\(--home-text\)/);
    assert.match(canvas, /useThemeChoice/);
    assert.match(canvas, /colorMode=\{choice\}/);
    assert.doesNotMatch(light, /\.library-shell \.uml-card \{/);
  });
});
