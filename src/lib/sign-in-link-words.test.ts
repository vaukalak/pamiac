import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(
  new URL("../components/login/login-sign-in-copy.tsx", import.meta.url),
  "utf8",
);
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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
  it("keeps the rest of the home lede after the sign-in clause", () => {
    const lede = slice(home, '<p className="lede">', "</p>");

    expect(lede).toMatch(
      /We email you a link to sign in, draw UML, and write notes you can drag into shape\.\s+Every\s+document has a direct link\. Share it by email, password, or in public, and give an agent\s+a token so it can search and edit your library\./,
    );
    expect(lede).not.toMatch(/magic/i);
  });

  it("explains the login card in ordinary words and leaves the form copy alone", () => {
    const card = slice(login, '<section className="auth-card">', "</section>");

    expect(copy).toMatch(
      /We email you a link\. There is no password\. If the address is new, opening the link\s+creates\s+the account\./,
    );
    expect(copy).not.toMatch(/magic/i);
    expect(card).not.toMatch(/magic/i);
    expect(form).toMatch(/loginSendFailureSentence\(result\.error\.message\)/);
    expect(form).not.toMatch(/magic link/i);
    expect(form).not.toMatch(/Could not send the magic link/);
    expect(sent).toMatch(/Development only: open the link/);
    expect(form).toMatch(/status === "sending" \? "Sending link…" : "Email me a link"/);
  });
});
