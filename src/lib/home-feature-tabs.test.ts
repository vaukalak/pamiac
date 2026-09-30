import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const catalog = readFileSync(
  new URL("../components/home/home-feature-catalog.ts", import.meta.url),
  "utf8",
);
const tabs = readFileSync(
  new URL("../components/home/home-feature-tab-list.tsx", import.meta.url),
  "utf8",
);
const tab = readFileSync(
  new URL("../components/home/home-feature-tab.tsx", import.meta.url),
  "utf8",
);
const panel = readFileSync(
  new URL("../components/home/home-feature-panel.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const pictures = [
  "rich-notes-picture.tsx",
  "agent-access-picture.tsx",
  "workspaces-picture.tsx",
].map((name) => readFileSync(new URL(`../components/home/${name}`, import.meta.url), "utf8"));

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

describe("home feature tabs", () => {
  it("lists the three features in order with their descriptions", () => {
    const labels = [...catalog.matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);
    const descriptions = [...catalog.matchAll(/description: "([^"]+)"/g)].map((match) => match[1]);

    assert.deepEqual(labels, ["Rich notes", "Agent access", "Personal and team workspaces"]);
    assert.deepEqual(descriptions, [
      "Turn rough thoughts into structured, shareable documents.",
      "Let agents search, create, and update your workspace.",
      "A private desk, and named workspaces you can invite people into.",
    ]);
  });

  it("wires each tab to the single picture panel and moves selection from the keyboard", () => {
    expect(tabs).toMatch(/aria-orientation="vertical"/);
    expect(tabs).toMatch(/ArrowDown/);
    expect(tabs).toMatch(/ArrowUp/);
    expect(tabs).toMatch(/ArrowLeft/);
    expect(tabs).toMatch(/ArrowRight/);
    expect(tabs).toMatch(/Home/);
    expect(tabs).toMatch(/End/);
    expect(tabs).toMatch(/preventDefault\(\)/);
    expect(tabs).toMatch(/onSelect\(feature\.id\)/);
    expect(tabs).toMatch(/\.focus\(\)/);
    expect(tab).toMatch(/role="tab"/);
    expect(tab).toMatch(/aria-selected=\{selected\}/);
    expect(tab).toMatch(/aria-controls=\{controls\}/);
    expect(tab).toMatch(/id=\{tabId\}/);
    expect(tab).toMatch(/tabIndex=\{selected \? 0 : -1\}/);
    expect(tab).toMatch(/<Paragraph>/);
    expect(panel).toMatch(/role="tabpanel"/);
    expect(panel).toMatch(/aria-labelledby=\{labelledBy\}/);
    expect(panel).toMatch(/id=\{panelId\}/);
    expect(catalog).toMatch(/homeFeaturePanelId = "home-feature-panel"/);
    expect(catalog).toMatch(/return `home-tab-\$\{id\}`/);
  });

  it("shows one token-colored picture and keeps motion optional", () => {
    const labels = pictures.map((picture) => picture.match(/aria-label="([^"]+)"/)?.[1]);

    assert.deepEqual(labels, [
      "Note page with a title and text blocks",
      "Agent connection beside a document list",
      "Personal space beside a named team workspace",
    ]);
    for (const picture of pictures) {
      expect(picture).toMatch(/var\(--paper\)/);
      expect(picture).toMatch(/var\(--ink\)/);
      expect(picture).toMatch(/var\(--teal\)/);
      expect(picture).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
    expect(css).toMatch(/\.hero-tab\[aria-selected="true"\]/);
    expect(css).toMatch(/border-color:\s*var\(--teal\)/);
    expect(css).toMatch(
      /@media \(max-width: 900px\) \{[\s\S]*\.hero,[\s\S]*grid-template-columns:\s*1fr/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.hero-preview svg \{[\s\S]*animation:\s*none/,
    );
  });
});
