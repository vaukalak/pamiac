import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const page = readFileSync(new URL("../app/support/page.tsx", import.meta.url), "utf8");
const form = readFileSync(
  new URL("../components/support/support-form.tsx", import.meta.url),
  "utf8",
);
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = readStylesheet();

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

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

describe("support board", () => {
  it("centers the contact form on the home board and keeps the copy", () => {
    expect(page).toMatch(/<div className="home">/);
    expect(page).toMatch(/<CircuitBoard \/>/);
    expect(page).toMatch(/<AppHeader \/>/);
    expect(page).toMatch(/<Page className="home-support">/);
    expect(page).toMatch(/<Section className="home-support-panel">/);
    expect(page).not.toMatch(/eyebrow=/);
    expect(page).toMatch(/title="Contact support"/);
    expect(page).toMatch(/subtitle="This message goes to Pamiac support\."/);
    expect(page).toMatch(/<Paragraph>Use the email you sign in with\.<\/Paragraph>/);
    expect(page).toMatch(/<SupportForm \/>/);
    expect(page).toMatch(
      /<footer className="home-foot">\s*<p>Built for human ideas and machine intelligence\.<\/p>/,
    );
    expect(page).not.toMatch(/auth-wrap|auth-card|<main|<button|<input|<select/);
  });

  it("keeps the support form contract", () => {
    expect(form).toMatch(/fetch\("\/api\/support"/);
    expect(form).toMatch(/Could not send your message/);
    expect(form).toMatch(/Your message is with Pamiac support\./);
    expect(form).toMatch(/We will reply to this email\./);
    expect(form).toMatch(/mutation\.isPending \? "Sending…" : "Send to support"/);
    expect(form).toMatch(/<Form\.Input/);
    expect(form).toMatch(/<Form\.Textarea/);
    expect(form).toMatch(/<Alert>\{error\}<\/Alert>/);
    expect(form).not.toMatch(/<input|<textarea|<button|<select/);
  });

  it("paints the panel, fields, and send control with home tokens", () => {
    const support = slice(css, ".home .home-support {", "@media (prefers-reduced-motion: reduce)");

    expect(support).toMatch(/width:\s*min\(460px,\s*calc\(100% - 32px\)\)/);
    expect(support).toMatch(/background:\s*var\(--home-panel\)/);
    expect(support).toMatch(/border:\s*1px solid var\(--home-hair\)/);
    expect(support).toMatch(/border-radius:\s*16px/);
    expect(support).toMatch(/box-shadow:\s*var\(--home-shadow\)/);
    expect(support).toMatch(/\.home \.home-support-panel h1\s*\{[^}]*font-family:\s*var\(--sans\)/);
    expect(support).toMatch(
      /\.home \.home-support-panel label\s*\{[^}]*color:\s*var\(--home-text\)/,
    );
    expect(support).toMatch(/background:\s*var\(--home-field\)/);
    expect(support).toMatch(/border-color:\s*var\(--home-line\)/);
    expect(support).toMatch(/caret-color:\s*var\(--home-lime\)/);
    expect(support).toMatch(
      /\.home \.home-support-panel input::placeholder,\s*\.home \.home-support-panel textarea::placeholder\s*\{[^}]*color:\s*var\(--home-soft\)/,
    );
    expect(support).toMatch(
      /\.home \.home-support-panel input:focus,\s*\.home \.home-support-panel textarea:focus\s*\{[^}]*border-color:\s*var\(--home-lime\)/,
    );
    expect(support).toMatch(
      /box-shadow:\s*0 0 0 3px color-mix\(in srgb, var\(--home-lime\) 35%, transparent\)/,
    );
    expect(support).toMatch(
      /\.home \.home-support-panel \.error\s*\{[^}]*color:\s*var\(--home-danger\)/,
    );
    expect(support).toMatch(
      /\.home \.home-support-panel \.btn\s*\{[^}]*width:\s*100%[^}]*background:\s*var\(--home-lime\)[^}]*color:\s*var\(--home-on-lime\)/,
    );
    expect(support).toMatch(
      /\.home \.home-support-panel \.btn:hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--home-lime-deep\)/,
    );
    expect(support).toMatch(/\.home \.home-support-panel \.btn:disabled\s*\{[^}]*opacity:\s*0\.45/);
    expect(support).not.toMatch(
      /animation:|transition:|var\(--field\)|var\(--teal\)|var\(--focus\)/,
    );
    expect(css).toMatch(
      /input:focus,\s*textarea:focus,\s*select:focus\s*\{[^}]*border-color:\s*var\(--teal\)/,
    );
    expect(css).toMatch(/background:\s*var\(--field\)/);
    expect(css).toMatch(/\.auth-card\s*\{/);
  });

  it("leaves the home page composition in place", () => {
    expect(home).toMatch(/<div className="home">/);
    expect(home).toMatch(/<CircuitBoard \/>/);
    expect(home).toMatch(/<AppHeader \/>/);
    expect(home).toMatch(/<main className="home-main">/);
    expect(home).toMatch(/<HomeStage \/>/);
    expect(home).toMatch(/Built for human ideas and machine intelligence\./);
    expect(home).not.toMatch(/home-support|SupportForm|auth-card/);
  });
});
