import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const features = readFileSync(
  new URL("../components/home/home-features.tsx", import.meta.url),
  "utf8",
);
const featureCard = readFileSync(
  new URL("../components/home/home-feature-card.tsx", import.meta.url),
  "utf8",
);
const preview = readFileSync(
  new URL("../components/home/workspace-preview.tsx", import.meta.url),
  "utf8",
);
const body = readFileSync(new URL("../components/home/preview-body.tsx", import.meta.url), "utf8");
const note = readFileSync(new URL("../components/home/preview-note.tsx", import.meta.url), "utf8");
const graph = readFileSync(
  new URL("../components/home/preview-graph.tsx", import.meta.url),
  "utf8",
);
const spaces = readFileSync(
  new URL("../components/home/preview-spaces.tsx", import.meta.url),
  "utf8",
);
const css = readStylesheet();

function mediaBlock(source: string, query: string) {
  const header = `@media ${query}`;
  let at = source.indexOf(header);
  const blocks: string[] = [];
  while (at >= 0) {
    const open = source.indexOf("{", at);
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      const character = source[index];
      if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          blocks.push(source.slice(open + 1, index));
          break;
        }
      }
    }
    at = source.indexOf(header, at + header.length);
  }
  assert.ok(blocks.length > 0, header);
  return blocks.join("\n");
}

describe("home feature tabs", () => {
  it("keeps the tab row on the client so selection can change", () => {
    assert.match(features, /^"use client";/);
    assert.match(featureCard, /^"use client";/);
  });

  it("moves selection and focus with arrows, Home, and End", () => {
    assert.match(features, /aria-orientation="horizontal"/);
    assert.match(features, /if \(key === "Home"\) return FEATURES\[0\]\.id/);
    assert.match(features, /if \(key === "End"\) return FEATURES\[FEATURES\.length - 1\]\.id/);
    assert.match(features, /key === "ArrowRight" \|\| key === "ArrowDown"/);
    assert.match(features, /key === "ArrowLeft" \|\| key === "ArrowUp"/);
    assert.match(features, /onSelect\(next\)/);
    assert.match(features, /document\.getElementById\(`home-tab-\$\{next\}`\)\?\.focus\(\)/);
    assert.match(featureCard, /id=\{`home-tab-\$\{feature\.id\}`\}/);
    assert.match(featureCard, /tabIndex=\{selected \? 0 : -1\}/);
  });

  it("paints the lime hairline on the selected tab only", () => {
    assert.match(
      css,
      /\.home-feature\[aria-selected="true"\]\s*\{[^}]*border-color:\s*var\(--home-hair-strong\)/,
    );
    assert.doesNotMatch(css, /\.home-feature:first-child/);
  });

  it("swaps the preview picture inside the same frame", () => {
    assert.match(preview, /notes: "Notes"/);
    assert.match(preview, /agent: "Agents"/);
    assert.match(preview, /workspaces: "Field notes"/);
    assert.match(preview, /className="home-preview"/);
    assert.match(body, /notes: "Notes"/);
    assert.match(body, /agent: "Agents"/);
    assert.match(body, /workspaces: "Home"/);
    assert.match(note, /Product strategy/);
    assert.doesNotMatch(note, /PreviewGraph|<svg/);
    assert.match(graph, /aria-label="Agent connected to documents"/);
    assert.match(graph, />\s*Agent\s*</);
    assert.match(spaces, /name: "Personal"/);
    assert.match(spaces, /name: "Field notes"/);
    assert.match(spaces, /detail: "Private desk"/);
    assert.match(
      css,
      /\.home-preview-desk\.is-open\s*\{[^}]*border-color:\s*var\(--home-hair-strong\)/,
    );
  });

  it("keeps the stacked tabs and preview usable, and stops the swap animation when motion is reduced", () => {
    const stacked = mediaBlock(css, "(max-width: 960px)");
    assert.match(stacked, /\.home-features\s*\{[^}]*grid-template-columns:\s*1fr/);
    assert.doesNotMatch(stacked, /\.home-preview\s*\{[^}]*display:\s*none/);
    assert.doesNotMatch(stacked, /\.home-features\s*\{[^}]*display:\s*none/);
    const reduced = mediaBlock(css, "(prefers-reduced-motion: reduce)");
    assert.match(reduced, /\.home-preview-scene\s*\{[^}]*animation:\s*none/);
  });
});
