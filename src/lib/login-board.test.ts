import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
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

function signInRules() {
  const supportEnd = css.indexOf("@media (prefers-reduced-motion: reduce)");
  const start = css.indexOf(".home .home-sign-in {");
  assert.ok(supportEnd >= 0, "support motion query");
  assert.ok(start > supportEnd, ".home .home-sign-in sits outside the support slice");
  return css.slice(start);
}

describe("login board", () => {
  it("keeps setup, oauth, and the session redirect on the server page", () => {
    expect(page).toMatch(/export const dynamic = "force-dynamic"/);
    expect(page).toMatch(/if \(result\.status === "setup"\) return <SetupScreen \/>/);
    expect(page).toMatch(
      /if \(result\.status === "error"\) return <SetupScreen detail=\{result\.message\} \/>/,
    );
    expect(page).toMatch(/oauthAuthorizeResumePath\(query\)/);
    expect(page).toMatch(/oauthLoginReturnPath\(query\)/);
    expect(page).toMatch(/oauthResume \? await getSession\(\) : await getLibrarySession\(\)/);
    expect(page).toMatch(/if \(result\.session\) redirect\(nextPath\)/);
  });

  it("sends the magic link with the same address, name, and callback", () => {
    expect(form).toMatch(/authClient\.signIn\.magicLink\(\{/);
    expect(form).toMatch(/callbackURL: nextPath/);
    expect(form).toMatch(/name: email\.split\("@"\)\[0\] \|\| "User"/);
    expect(form).toMatch(
      /if \(!showDevLink\) return \{ devUrl: null \};\s*try \{\s*const dev = await fetch\(`\/api\/dev\/magic-link\?email=\$\{encodeURIComponent\(email\)\}`\)/,
    );
    expect(form).toMatch(/useForm</);
    expect(form).toMatch(/mutation\.isPending/);
    expect(form).not.toMatch(/useState\(""\)|<input|<button|<select/);
  });

  it("paints the sign-in panel with home tokens outside the support slice", () => {
    const signIn = signInRules();

    expect(signIn).toMatch(/width:\s*min\(460px,\s*calc\(100% - 32px\)\)/);
    expect(signIn).toMatch(/background:\s*var\(--home-panel\)/);
    expect(signIn).toMatch(/border:\s*1px solid var\(--home-hair\)/);
    expect(signIn).toMatch(/border-radius:\s*16px/);
    expect(signIn).toMatch(/box-shadow:\s*var\(--home-shadow\)/);
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel label\s*\{[^}]*color:\s*var\(--home-text\)/,
    );
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel input::placeholder,\s*\.home \.home-sign-in-panel textarea::placeholder\s*\{[^}]*color:\s*var\(--home-soft\)/,
    );
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel input:focus,\s*\.home \.home-sign-in-panel textarea:focus\s*\{[^}]*border-color:\s*var\(--home-lime\)/,
    );
    expect(signIn).toMatch(/box-shadow:\s*0 0 0 3px rgba\(185,\s*245,\s*66,\s*0\.35\)/);
    expect(signIn).toMatch(/input:-webkit-autofill/);
    expect(signIn).toMatch(/-webkit-text-fill-color:\s*var\(--home-text\)/);
    expect(signIn).toMatch(/box-shadow:\s*0 0 0 1000px #101410 inset/);
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel \.btn:not\(\.ghost\)\s*\{[^}]*width:\s*100%[^}]*background:\s*var\(--home-lime\)[^}]*color:\s*var\(--home-on-lime\)/,
    );
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel \.btn:not\(\.ghost\):hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--home-lime-deep\)/,
    );
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel \.btn:not\(\.ghost\):disabled\s*\{[^}]*opacity:\s*0\.45/,
    );
    expect(signIn).toMatch(
      /\.home \.home-sign-in-panel \.btn\.ghost,\s*\.home \.home-sign-in-panel \.btn\.ghost:hover\s*\{[^}]*background:\s*transparent[^}]*color:\s*var\(--home-soft\)/,
    );
    expect(signIn).not.toMatch(
      /animation:|transition:|var\(--field\)|var\(--teal\)|var\(--focus\)/,
    );
    expect(css).toMatch(/\.home > \.home-sign-in,/);
  });
});
