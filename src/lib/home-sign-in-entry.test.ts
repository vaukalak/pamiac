import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const hero = readFileSync(new URL("../components/home/home-hero.tsx", import.meta.url), "utf8");
const stage = readFileSync(new URL("../components/home/home-stage.tsx", import.meta.url), "utf8");
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
const previewStage = readFileSync(
  new URL("../components/home/preview-stage.tsx", import.meta.url),
  "utf8",
);
const nav = readFileSync(
  new URL("../components/header/app-header-nav.tsx", import.meta.url),
  "utf8",
);
const css = readStylesheet();

const homeDirectory = new URL("../components/home/", import.meta.url);
const homeSources = readdirSync(homeDirectory).map((name) =>
  readFileSync(new URL(name, homeDirectory), "utf8"),
);

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

describe("home sign-in entry", () => {
  it("keeps the board hero copy and feature tabs without a second sign-in control", () => {
    expect(home).toMatch(/<div className="home">/);
    expect(home).toMatch(/<CircuitBoard \/>/);
    expect(home).toMatch(/<AppHeader \/>/);
    expect(home).toMatch(/<HomeStage \/>/);
    expect(home).toMatch(/Built for human ideas and machine intelligence\./);
    expect(stage).toMatch(/useState<HomeFeatureId>\("notes"\)/);
    expect(stage).toMatch(/<HomeHeroSection selected=\{selected\} \/>/);
    expect(stage).toMatch(/<HomeFeatures selected=\{selected\} onSelect=\{setSelected\} \/>/);
    expect(hero).toMatch(/<p className="eyebrow">Notes\. Diagrams\. Agents\.<\/p>/);
    expect(hero).toMatch(
      /A shared mind for you and your <span className="home-accent">agents\.<\/span>/,
    );
    expect(hero).toMatch(
      /className="lede">\s*Write notes, map ideas, and give your agents the context to move work forward\.\s*</,
    );
    expect(features).toMatch(
      /title: "Rich notes"[\s\S]*title: "Agent access"[\s\S]*title: "Personal and team workspaces"/,
    );
    expect(features).toMatch(/Turn rough thoughts into structured, shareable documents\./);
    expect(features).toMatch(/Let agents search, create, and update your workspace\./);
    expect(features).toMatch(/A private desk, and named workspaces you can invite people into\./);
    expect(features).not.toMatch(/UML canvas/);
    expect(features).toMatch(/role="tablist"/);
    expect(featureCard).toMatch(/role="tab"/);
    expect(featureCard).toMatch(/aria-selected=\{selected\}/);
    expect(featureCard).toMatch(/aria-controls="home-preview-panel"/);
    expect(preview).toMatch(/role="tabpanel"/);
    expect(preview).toMatch(/id="home-preview-panel"/);
    expect(preview).toMatch(/aria-labelledby=\{`home-tab-\$\{selected\}`\}/);
    expect(previewStage).toMatch(/selected === "notes" \? <PreviewNote \/> : null/);
    expect(previewStage).toMatch(/selected === "agent" \? <PreviewGraph \/> : null/);
    expect(previewStage).toMatch(/selected === "workspaces" \? <PreviewSpaces \/> : null/);
    expect(home).not.toMatch(/className="btn"/);
    expect(home).not.toMatch(/>\s*Sign in\s*</);
  });

  it("uses feature tabs and keeps links and a second sign-in control out of the home feature", () => {
    const buttons = homeSources.join("\n").match(/<button/g) ?? [];
    assert.equal(buttons.length, 1);
    expect(featureCard).toMatch(/role="tab"/);
    for (const source of homeSources) {
      expect(source).not.toMatch(/<Link/);
      expect(source).not.toMatch(/<a\s/);
      expect(source).not.toMatch(/className="btn/);
      expect(source).not.toMatch(/Get started/);
      expect(source).not.toMatch(/Connect an agent/);
      expect(source).not.toMatch(/Your knowledge\. Connected\./);
      expect(source).not.toMatch(/>\s*Sign in\s*</);
    }
  });

  it("names the header action Sign in and drops the unused hero-actions rule", () => {
    expect(nav).toMatch(/href="\/login"/);
    expect(nav).toMatch(/>\s*Sign in\s*</);
    expect(nav).not.toMatch(/Email me a link/);
    expect(css).not.toMatch(/\.hero-actions/);
    expect(css).toMatch(/\.row-actions\s*\{/);
    expect(css).not.toMatch(/\.feature-grid/);
    expect(css).toMatch(/\.doc-grid\s*\{/);
  });

  it("dims the board and animates the pulses, except under reduced motion", () => {
    const board = css.slice(
      css.indexOf(".home-board {"),
      css.indexOf("}", css.indexOf(".home-board {")),
    );
    expect(board).toMatch(/opacity:\s*0\.\d+/);
    expect(board).toMatch(/filter:\s*saturate\(0\.\d+\)/);
    expect(css).toMatch(/@keyframes home-pulse-run/);
    expect(css).toMatch(/@keyframes home-pad-breathe/);
    expect(css).toMatch(/\.home-trace-pulse\s*\{[^}]*stroke-dasharray:\s*0\.14 0\.86/);
    expect(css).toMatch(
      /\.home-trace-glow,\s*\.home-trace-pulse\s*\{[^}]*animation:\s*home-pulse-run/,
    );
    expect(css).toMatch(/\.home-pad\s*\{[^}]*animation:\s*home-pad-breathe/);

    const reduced = mediaBlock(css, "(prefers-reduced-motion: reduce)");
    expect(reduced).toMatch(/\.home-trace-glow,\s*\.home-trace-pulse\s*\{[^}]*display:\s*none/);
    expect(reduced).toMatch(/\.home-pad\s*\{[^}]*animation:\s*none/);
  });
});
