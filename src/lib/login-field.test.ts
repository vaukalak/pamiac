import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
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
  it("paints the sign-in fields with the board and leaves the desk fields alone", () => {
    const fields = block(
      css,
      'input[type="text"],\ninput[type="email"],\ninput[type="password"],\ntextarea,\nselect {',
    );
    const email = block(
      css,
      ".home .home-sign-in-panel input,\n.home .home-sign-in-panel textarea {",
    );
    const focus = block(css, "input:focus,\ntextarea:focus,\nselect:focus {");
    const light = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"));
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));

    expect(fields).toMatch(/background:\s*var\(--field\)/);
    expect(fields).toMatch(/border:\s*1px solid var\(--line\)/);
    expect(email).toMatch(/background:\s*#101410/);
    expect(email).toMatch(/caret-color:\s*var\(--home-lime\)/);
    expect(email).toMatch(/border-color:\s*var\(--home-line\)/);
    expect(email).not.toMatch(/var\(--field\)|var\(--teal\)|var\(--focus\)/);
    expect(focus).toMatch(/border-color:\s*var\(--teal\)/);
    expect(focus).toMatch(/box-shadow:\s*var\(--focus\)/);
    expect(light).toMatch(/--card:\s*#fffdf8/);
    expect(light).toMatch(/--field:\s*#fff/);
    expect(dark).toMatch(/--card:\s*#221e19/);
    expect(dark).toMatch(/--field:\s*#1b1814/);
    expect(form).toMatch(/type="email"/);
    expect(form).not.toMatch(/placeholder=/);
    expect(form).toMatch(/Email me a link/);
    expect(login).toMatch(
      /<LoginForm\s+agentConnect=\{isOAuthLoginQuery\(query\)\}\s+googleEnabled=\{googleSignInEnabled\(\)\}\s+nextPath=\{formNext\}\s+showDevLink=\{showDevLink\}\s*\/>/,
    );
    expect(locked).not.toMatch(/home-sign-in/);
    expect(member).not.toMatch(/home-sign-in/);
  });
});

describe("sign-in email sample", () => {
  it("keeps a labeled empty email box and no sample address", () => {
    expect(form).toMatch(/label="Email"/);
    expect(form).toMatch(/name="email"/);
    expect(form).toMatch(/autoComplete="email"/);
    expect(form).toMatch(/<Form\.Input/);
    expect(form).not.toMatch(/you@example\.com/);
    expect(form).not.toMatch(/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(sent).toMatch(/We sent a link to \{address\}\./);
    expect(sent).toMatch(/Check your inbox, then spam, then promotions,/);
    expect(sent).toMatch(/and it can take a minute\./);
    expect(sent).not.toMatch(/Email me a link again/);
  });
});
