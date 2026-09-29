import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const locked = readFileSync(new URL("../components/locked-document.tsx", import.meta.url), "utf8");
const member = readFileSync(
  new URL("../components/library/workspace-member-add.tsx", import.meta.url),
  "utf8",
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

describe("sign-in email fill", () => {
  it("paints only the sign-in email with the card sheet in both schemes", () => {
    const fields = block(
      css,
      'input[type="text"],\ninput[type="email"],\ninput[type="password"],\ntextarea,\nselect {',
    );
    const email = block(css, '.auth-door .auth-card input[type="email"] {');
    const focus = block(css, "input:focus,\ntextarea:focus,\nselect:focus {");
    const light = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"));
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));

    expect(fields).toMatch(/background:\s*var\(--field\)/);
    expect(fields).toMatch(/border:\s*1px solid var\(--line\)/);
    expect(email).toMatch(/background:\s*var\(--card\)/);
    expect(email).not.toMatch(/var\(--field\)/);
    expect(email).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(email).not.toMatch(/border:|box-shadow:|color:|font-|padding:|border-radius:/);
    expect(focus).toMatch(/border-color:\s*var\(--teal\)/);
    expect(focus).toMatch(/box-shadow:\s*var\(--focus\)/);
    expect(light).toMatch(/--card:\s*#fffdf8/);
    expect(light).toMatch(/--field:\s*#fff/);
    expect(dark).toMatch(/--card:\s*#221e19/);
    expect(dark).toMatch(/--field:\s*#1b1814/);
    expect(form).toMatch(/type="email"/);
    expect(form).not.toMatch(/placeholder=/);
    expect(form).toMatch(/Email me a link/);
    expect(login).toMatch(/<LoginForm nextPath=\{nextPath\} \/>/);
    expect(locked).not.toMatch(/auth-door/);
    expect(member).not.toMatch(/auth-door/);
  });
});

describe("sign-in email sample", () => {
  it("keeps a labeled empty email box and no sample address", () => {
    expect(form).toMatch(/<label htmlFor="email">Email<\/label>/);
    expect(form).toMatch(/autoComplete="email"/);
    expect(form).toMatch(/\brequired\b/);
    expect(form).not.toMatch(/you@example\.com/);
    expect(form).not.toMatch(/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(sent).toMatch(/We sent a link to \{address\}\./);
    expect(sent).toMatch(/Check your inbox, then spam, then promotions,/);
    expect(sent).toMatch(/and it can take a minute\./);
    expect(sent).not.toMatch(/Email me a link again/);
  });
});
