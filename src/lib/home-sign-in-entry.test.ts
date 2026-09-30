import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const features = readFileSync(
  new URL("../components/home/home-features.tsx", import.meta.url),
  "utf8",
);
const column = readFileSync(
  new URL("../components/home/home-feature-column.tsx", import.meta.url),
  "utf8",
);
const tabs = readFileSync(
  new URL("../components/home/home-feature-tab-list.tsx", import.meta.url),
  "utf8",
);
const catalog = readFileSync(
  new URL("../components/home/home-feature-catalog.ts", import.meta.url),
  "utf8",
);
const panel = readFileSync(
  new URL("../components/home/home-feature-panel.tsx", import.meta.url),
  "utf8",
);
const nav = readFileSync(
  new URL("../components/header/app-header-nav.tsx", import.meta.url),
  "utf8",
);
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

describe("home sign-in entry", () => {
  it("keeps the hero copy and feature tabs without a second sign-in control", () => {
    expect(home).toMatch(/<p className="eyebrow">Notes, UML, and agents<\/p>/);
    expect(home).toMatch(/<h1>A desk for diagrams that an agent can read\.<\/h1>/);
    expect(home).toMatch(/className="lede"/);
    expect(home).not.toMatch(/className="btn"/);
    expect(home).not.toMatch(/>\s*Sign in\s*</);
    expect(catalog).toMatch(/label: "Rich notes"/);
    expect(catalog).toMatch(/label: "Agent access"/);
    expect(catalog).toMatch(/label: "Personal and team workspaces"/);
    expect(catalog).not.toMatch(/UML canvas/);
    expect(catalog).not.toMatch(/Agent token/);
    expect(features).toMatch(/useState<HomeFeatureId>\("rich-notes"\)/);
    expect(features).toMatch(/<HomeFeaturePanel/);
    expect(column).toMatch(/className="hero-copy"/);
    expect(tabs).toMatch(/role="tablist"/);
    expect(panel).toMatch(/role="tabpanel"/);
    expect(panel).toMatch(/featureId === "rich-notes" \? <RichNotesPicture \/>/);
    expect(panel).toMatch(/featureId === "agent-access" \? <AgentAccessPicture \/>/);
    expect(panel).toMatch(/featureId === "workspaces" \? <WorkspacesPicture \/>/);
    expect(css).toMatch(/grid-template-columns:\s*1\.15fr 0\.85fr/);
    expect(css).toMatch(/\.hero-preview svg/);
  });

  it("names the header action Sign in and drops the unused hero-actions rule", () => {
    expect(nav).toMatch(/href="\/login"/);
    expect(nav).toMatch(/>\s*Sign in\s*</);
    expect(nav).not.toMatch(/Email me a link/);
    expect(css).not.toMatch(/\.hero-actions/);
    expect(css).toMatch(/\.row-actions\s*\{/);
  });
});
