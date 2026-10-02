import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const hero = readFileSync(new URL("../components/home/home-hero.tsx", import.meta.url), "utf8");
const nav = readFileSync(
  new URL("../components/header/app-header-nav.tsx", import.meta.url),
  "utf8",
);
const form = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const locked = readFileSync(
  new URL("../components/document/locked-sign-in.tsx", import.meta.url),
  "utf8",
);
const login = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
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

describe("sign-in step name", () => {
  it("uses Sign in on the header and Email me a link on the login button", () => {
    expect(home).not.toMatch(/hero-actions/);
    expect(home).not.toMatch(/href="\/login"/);
    expect(home).not.toMatch(/Open the library/);
    expect(home).not.toMatch(/Continue with email/);
    expect(nav).toMatch(/<Link className="btn" href="\/login">\s*Sign in\s*<\/Link>/);
    expect(form).toMatch(/mutation\.isPending \? "Sending link…" : "Email me a link"/);
    expect(form).not.toMatch(/Email me a magic link/);
  });

  it("states the home lede in ordinary words and leaves the other sign-in titles alone", () => {
    expect(hero).toMatch(
      /Write notes, map ideas, and give your agents the context to move work forward\./,
    );
    expect(home).not.toMatch(/magic/i);
    expect(hero).not.toMatch(/magic/i);
    expect(login).toMatch(/<PageTitle title="Sign in or register" \/>/);
    expect(locked).toMatch(/<PageTitle title="Sign in to view" \/>/);
    expect(locked).toMatch(/>\s*Continue with email\s*</);
    expect(form).toMatch(/authClient\.signIn\.magicLink\(/);
  });
});
