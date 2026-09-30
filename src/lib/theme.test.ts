import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const noteEditor = readFileSync(new URL("../components/note-editor.tsx", import.meta.url), "utf8");
const umlEditor = readFileSync(
  new URL("../components/diagram/uml-canvas.tsx", import.meta.url),
  "utf8",
);
const umlNode = readFileSync(new URL("../components/uml-node.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

function mediaBlock(source: string, query: string) {
  const header = `@media ${query}`;
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`unclosed ${header}`);
}

const darkTokens = [
  "--paper: #141210",
  "--paper-deep: #0e0c0a",
  "--paper-top: #1c1916",
  "--ink: #f4efe6",
  "--ink-soft: #a89880",
  "--line: #7d7264",
  "--card: #221e19",
  "--teal: #6ec9c0",
  "--teal-deep: #1f6f69",
  "--amber: #e39a62",
  "--danger: #e7a097",
  "--shadow: 0 18px 50px rgba(0, 0, 0, 0.45)",
  "--on-ink: #141210",
  "--field: #1b1814",
  "--wash: #2c2822",
  "--dev-wash: #2c2822",
  "--glow: rgba(110, 201, 192, 0.14)",
  "--focus: 0 0 0 3px rgba(110, 201, 192, 0.35)",
  "--danger-line: #a86b64",
  "--empty: rgba(34, 30, 25, 0.72)",
  "--canvas: #1a1714",
  "--canvas-grid: #2e2923",
  "--flow-grid: #3a342c",
  "--uml-fill: #2a251f",
  "--uml-ink: #f4efe6",
  "--uml-note: #3a3120",
  "--uml-note-edge: #e2b56a",
  "--uml-note-shadow: #e39a62",
  "--mark-line: #141210",
  "--scrim: rgba(0, 0, 0, 0.55)",
  "--secret-bg: #0c1816",
  "--secret-ink: #d7f3ee",
  "color-scheme: dark",
];

const lightTokens = [
  "--paper: #f3efe4",
  "--paper-deep: #e6e0d1",
  "--ink: #1a1814",
  "--ink-soft: #5e584e",
  "--line: #d8d0c2",
  "--card: #fffdf8",
  "--teal: #0e6b66",
  "--teal-deep: #084743",
  "--amber: #b8612b",
  "--danger: #9c3b32",
  "--on-ink: #f7f4ec",
  "--field: #fff",
  "--wash: #f6f1e6",
  "--dev-wash: #f4efe2",
  "--paper-top: #f7f4ec",
  "--glow: rgba(14, 107, 102, 0.08)",
  "--focus: 0 0 0 3px rgba(14, 107, 102, 0.15)",
  "--danger-line: #e3c6c2",
  "--empty: rgba(255, 253, 248, 0.6)",
  "--canvas: #fbf8f2",
  "--canvas-grid: #efeae0",
  "--flow-grid: #d9d0c0",
  "--uml-fill: #fffdf8",
  "--uml-ink: #1a1814",
  "--uml-note: #f6e7b8",
  "--uml-note-edge: #6d5420",
  "--uml-note-shadow: #b8612b",
  "--mark-line: #f3efe4",
  "--scrim: rgba(26, 24, 20, 0.35)",
  "--secret-bg: #14211f",
  "--secret-ink: #e7f6f3",
  "color-scheme: light",
];

test("dark color scheme keeps the warm desk tokens", () => {
  const dark = mediaBlock(css, "(prefers-color-scheme: dark)");
  for (const token of darkTokens) {
    assert.ok(dark.includes(token), token);
  }
  assert.match(dark, /\.note-editor \.bn-container\[data-color-scheme\]/);
  for (const variable of [
    "--bn-colors-editor-text: var(--ink)",
    "--bn-colors-editor-background: var(--card)",
    "--bn-colors-menu-text: var(--ink)",
    "--bn-colors-menu-background: var(--card)",
    "--bn-colors-tooltip-text: var(--ink)",
    "--bn-colors-tooltip-background: var(--wash)",
    "--bn-colors-hovered-text: var(--ink)",
    "--bn-colors-hovered-background: var(--wash)",
    "--bn-colors-selected-text: var(--on-ink)",
    "--bn-colors-selected-background: var(--teal)",
    "--bn-colors-disabled-text: var(--ink-soft)",
    "--bn-colors-disabled-background: var(--paper-deep)",
    "--bn-colors-shadow: var(--paper-deep)",
    "--bn-colors-border: var(--line)",
    "--bn-colors-side-menu: var(--ink-soft)",
  ]) {
    assert.ok(dark.includes(variable), variable);
  }
});

test("light tokens stay on :root and shared chrome uses them", () => {
  const light = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"));
  for (const token of lightTokens) {
    assert.ok(light.includes(token), token);
  }
  assert.match(css, /scrollbar-color:\s*var\(--line\)\s+transparent/);
  assert.match(css, /caret-color:\s*var\(--teal\)/);
  assert.match(css, /::selection\s*\{[^}]*background:\s*var\(--teal\)/);
  assert.match(css, /::selection\s*\{[^}]*color:\s*var\(--on-ink\)/);
  assert.match(css, /::placeholder\s*\{[^}]*color:\s*var\(--ink-soft\)/);
  assert.doesNotMatch(css, /localStorage/);
  assert.doesNotMatch(css, /html\.dark/);
});

test("diagram and note surfaces follow the scheme without a toggle", () => {
  assert.equal(umlNode.includes("#1a1814"), false);
  assert.match(umlNode, /stroke="var\(--uml-ink\)"/);
  assert.match(umlEditor, /stroke:\s*"var\(--uml-ink\)"/);
  assert.match(umlEditor, /colorMode="system"/);
  assert.match(umlEditor, /color="var\(--flow-grid\)"/);
  assert.match(umlEditor, /fill="var\(--uml-fill\)"/);
  assert.match(umlEditor, /fill="var\(--uml-ink\)"/);
  assert.match(noteEditor, /useSyncExternalStore/);
  assert.match(noteEditor, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(noteEditor, /return false/);
  assert.match(noteEditor, /libraryShell = false/);
  assert.match(noteEditor, /theme=\{libraryShell \|\| dark \? "dark" : "light"\}/);
  const noteDocument = readFileSync(
    new URL("../components/document/note-document.tsx", import.meta.url),
    "utf8",
  );
  assert.match(noteDocument, /libraryShell/);
  assert.doesNotMatch(noteEditor, /localStorage/);
  assert.match(layout, /\(prefers-color-scheme: light\)", color: "#f3efe4"/);
  assert.match(layout, /\(prefers-color-scheme: dark\)", color: "#141210"/);
});
