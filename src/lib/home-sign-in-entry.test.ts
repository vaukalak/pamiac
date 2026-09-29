import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
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
  it("keeps the hero copy and feature cards without a second sign-in control", () => {
    expect(home).toMatch(/<p className="eyebrow">Notes, UML, and agents<\/p>/);
    expect(home).toMatch(/<h1>A desk for diagrams that an agent can read\.<\/h1>/);
    expect(home).toMatch(/className="lede"/);
    expect(home).toMatch(/<strong>UML canvas<\/strong>/);
    expect(home).toMatch(/<strong>Rich notes<\/strong>/);
    expect(home).toMatch(/<strong>Agent token<\/strong>/);
    expect(home).not.toMatch(/className="btn"/);
    expect(home).not.toMatch(/>\s*Sign in\s*</);
  });

  it("names the header action Sign in and drops the unused hero-actions rule", () => {
    expect(nav).toMatch(/href="\/login"/);
    expect(nav).toMatch(/>\s*Sign in\s*</);
    expect(nav).not.toMatch(/Email me a link/);
    expect(css).not.toMatch(/\.hero-actions/);
    expect(css).toMatch(/\.row-actions\s*\{/);
  });
});
