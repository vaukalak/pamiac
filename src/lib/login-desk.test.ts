import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
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

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

describe("login desk", () => {
  it("puts an unlabeled note corner and diagram edge behind the card", () => {
    const marks = slice(page, '<div className="auth-ground"', "</div>");

    expect(page).toMatch(/className="auth-wrap auth-door"/);
    expect(marks).toMatch(/aria-hidden="true"/);
    expect(marks).toMatch(/className="auth-ground-note"/);
    expect(marks).toMatch(/className="auth-ground-diagram"/);
    expect(marks).toMatch(/var\(--uml-note\)/);
    expect(marks).toMatch(/var\(--uml-note-edge\)/);
    expect(marks).toMatch(/var\(--uml-fill\)/);
    expect(marks).toMatch(/var\(--uml-ink\)/);
    expect(marks).toMatch(/var\(--canvas\)/);
    expect(marks).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(marks).not.toMatch(/<a\b|<button\b|<input\b|href=|tabIndex|tabindex/);
    expect(page).toMatch(/<LoginForm nextPath=\{formNext\} \/>/);
  });

  it("keeps the marks from taking clicks, focus, or the card", () => {
    const door = slice(css, ".auth-door {", "label {");

    expect(door).toMatch(/\.auth-door\s*\{[^}]*overflow:\s*hidden/);
    expect(door).toMatch(/\.auth-door \.auth-card\s*\{[^}]*z-index:\s*1/);
    expect(door).toMatch(/\.auth-ground\s*\{[^}]*position:\s*absolute/);
    expect(door).toMatch(/pointer-events:\s*none/);
    expect(door).not.toMatch(/position:\s*fixed/);
    expect(door).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(door).toMatch(/\.auth-ground-diagram\s*\{[^}]*display:\s*none/);
    expect(door).toMatch(/@media \(min-width: 1180px\)/);
    expect(door).toMatch(/width:\s*min\(280px,\s*calc\(50% - 290px\)\)/);
  });
});
