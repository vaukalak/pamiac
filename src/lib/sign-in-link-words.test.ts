import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../components/home/home-hero.tsx", import.meta.url), "utf8");
const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const chooser = readFileSync(
  new URL("../components/login/login-chooser.tsx", import.meta.url),
  "utf8",
);
const magic = readFileSync(
  new URL("../components/login/login-magic-link-form.tsx", import.meta.url),
  "utf8",
);
const sent = readFileSync(
  new URL("../components/login/login-link-sent.tsx", import.meta.url),
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

function slice(source: string, startMark: string, endMark: string) {
  const start = source.indexOf(startMark);
  assert.ok(start >= 0, startMark);
  const end = source.indexOf(endMark, start + startMark.length);
  assert.ok(end > start, endMark);
  return source.slice(start, end);
}

describe("sign-in link words", () => {
  it("keeps the home lede in ordinary words", () => {
    const lede = slice(home, '<p className="lede">', "</p>");

    expect(lede).toMatch(
      /Write notes, map ideas, and give your agents the context to move work forward\./,
    );
    expect(lede).not.toMatch(/magic/i);
  });

  it("explains the login panel in ordinary words and leaves the form copy alone", () => {
    const panel = slice(login, '<Section className="home-sign-in-panel">', "</Section>");

    expect(copy).toMatch(
      /We email you a link\. If the address is new, opening the link\s+creates\s+the account\./,
    );
    expect(copy).not.toMatch(/magic/i);
    expect(copy).not.toMatch(/There is no password/);
    expect(panel).not.toMatch(/magic/i);
    expect(magic).toMatch(/loginSendFailureSentence\(result\.error\.message\)/);
    expect(chooser).toMatch(/Send Magic Link/);
    expect(chooser).toMatch(/Or continue with email \/ password/);
    expect(chooser).not.toMatch(/authClient\.signIn\.magicLink/);
    expect(magic).toMatch(/authClient\.signIn\.magicLink\(/);
    expect(magic).not.toMatch(/Could not send the magic link/);
    expect(sent).toMatch(/Development only: open the link/);
    expect(magic).toMatch(/mutation\.isPending \? "Sending link…" : "Email me a link"/);
  });
});
