import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const header = readFileSync(
  new URL("../components/header/app-header.tsx", import.meta.url),
  "utf8",
);
const nav = readFileSync(
  new URL("../components/header/app-header-nav.tsx", import.meta.url),
  "utf8",
);
const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");

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

describe("login header sign-in", () => {
  it("hides the header Sign in link on /login and keeps it for other logged-out pages", () => {
    expect(header).toMatch(/usePathname\(\)/);
    expect(header).toMatch(/const showSignIn = !email && pathname !== "\/login"/);
    expect(header).toMatch(/const showNav = Boolean\(email\) \|\| showSignIn/);
    expect(header).toMatch(
      /\{showNav \? <AppHeaderNav email=\{email\} showSignIn=\{showSignIn\} \/> : null\}/,
    );
    expect(header).not.toMatch(/<nav/);
    expect(header).toMatch(/href=\{email \? "\/workspace" : "\/"\}/);
    expect(nav).toMatch(/<nav className="nav-links">/);
    expect(nav).toMatch(/\{email \? <ProfileMenu email=\{email\} \/> : null\}/);
    expect(nav).toMatch(/\{showSignIn \? \([\s\S]*href="\/login"[\s\S]*Sign in[\s\S]*\) : null\}/);
    expect(login).toMatch(/<AppHeader \/>/);
    expect(home).toMatch(/<AppHeader \/>/);
    expect(login).not.toMatch(/Email me a magic link/);
  });

  it("keeps the profile menu on a logged-in page", () => {
    expect(profile).toMatch(/<AppHeader email=\{result\.session\.user\.email\} \/>/);
    expect(nav).toMatch(/<ProfileMenu email=\{email\} \/>/);
  });

  it("leaves the login form in place and keeps the home hero free of sign-in links", () => {
    expect(home).not.toMatch(/hero-actions/);
    expect(home).not.toMatch(/href="\/login"/);
    expect(login).toMatch(/<LoginForm nextPath=\{formNext\} showDevLink=\{showDevLink\} \/>/);
    expect(login).not.toMatch(/href="\/login"/);
  });
});
