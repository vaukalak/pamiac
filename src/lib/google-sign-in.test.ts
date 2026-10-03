import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { googleSignInEnabled, googleSocialProviders } from "./google-sign-in.ts";
import { loginSendFailureSentence } from "./login-send-failure.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

function restoreGoogleEnv() {
  if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalClientId;
  if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
  else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
}

afterEach(() => {
  restoreGoogleEnv();
});

describe("google sign-in configuration", () => {
  it("stays off unless both credentials are non-empty", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal(googleSignInEnabled(), false);
    assert.equal(googleSocialProviders(), undefined);

    process.env.GOOGLE_CLIENT_ID = "client";
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal(googleSignInEnabled(), false);
    assert.equal(googleSocialProviders(), undefined);

    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    assert.equal(googleSignInEnabled(), false);

    process.env.GOOGLE_CLIENT_ID = "   ";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    assert.equal(googleSignInEnabled(), false);
    assert.equal(googleSocialProviders(), undefined);

    process.env.GOOGLE_CLIENT_ID = "client";
    process.env.GOOGLE_CLIENT_SECRET = "  ";
    assert.equal(googleSignInEnabled(), false);
  });

  it("enables Google with select_account and does not return a boolean secret", () => {
    process.env.GOOGLE_CLIENT_ID = " google-client ";
    process.env.GOOGLE_CLIENT_SECRET = " google-secret ";

    assert.equal(googleSignInEnabled(), true);
    assert.deepEqual(googleSocialProviders(), {
      google: {
        clientId: "google-client",
        clientSecret: "google-secret",
        prompt: "select_account",
      },
    });
  });

  it("links Google to an existing verified email and keeps magic link", () => {
    const auth = readFileSync(join(root, "src/lib/auth.ts"), "utf8");

    assert.match(auth, /socialProviders: googleSocialProviders\(\)/);
    assert.match(auth, /accountLinking:\s*\{[^}]*enabled:\s*true/s);
    assert.match(auth, /trustedProviders:\s*\["google"\]/);
    assert.match(auth, /magicLink\(\{/);
    assert.doesNotMatch(auth, /GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET/);
  });

  it("passes the server flag into the login form and keeps the magic-link callback", () => {
    const page = readFileSync(join(root, "src/app/login/page.tsx"), "utf8");
    const form = readFileSync(join(root, "src/components/login-form.tsx"), "utf8");
    const chooser = readFileSync(join(root, "src/components/login/login-chooser.tsx"), "utf8");
    const magic = readFileSync(
      join(root, "src/components/login/login-magic-link-form.tsx"),
      "utf8",
    );

    assert.match(page, /googleSignInEnabled\(\)/);
    assert.match(page, /agentConnect=\{isOAuthLoginQuery\(query\)\}/);
    assert.match(page, /googleEnabled=\{googleSignInEnabled\(\)\}/);
    assert.match(page, /nextPath=\{formNext\}/);
    assert.match(magic, /authClient\.signIn\.magicLink\(\{/);
    assert.match(magic, /callbackURL: nextPath/);
    assert.match(
      chooser,
      /googleEnabled \? <LoginGoogle agentConnect=\{agentConnect\} nextPath=\{nextPath\} \/>/,
    );
    assert.doesNotMatch(magic, /LoginGoogle|<button/);
    assert.doesNotMatch(form, /GOOGLE_CLIENT|useState\(false\)|<button/);
  });

  it("starts Google with the same callback and the existing failure line", () => {
    const google = readFileSync(join(root, "src/components/login/login-google.tsx"), "utf8");
    const agent = readFileSync(
      join(root, "src/components/login/login-google-agent-copy.tsx"),
      "utf8",
    );
    const example = readFileSync(join(root, ".env.example"), "utf8");
    const readme = readFileSync(join(root, "README.md"), "utf8");

    assert.match(google, /useMutation\(/);
    assert.match(google, /mutation\.isPending/);
    assert.doesNotMatch(google, /useState\(/);
    assert.match(google, /authClient\.signIn\.social\(\{/);
    assert.match(google, /provider: "google"/);
    assert.match(google, /callbackURL: nextPath/);
    assert.match(google, /"Continue with Google"/);
    assert.match(google, /"Authorize with Google"/);
    assert.match(google, /This Google account opens the desk\./);
    assert.match(google, /<Paragraph>/);
    assert.match(google, /<Button /);
    assert.match(google, /<LoginSendFailure happened=\{message\} \/>/);
    assert.match(google, /loginAnnouncement\(\{/);
    assert.match(google, /aria-live="polite"/);
    assert.doesNotMatch(google, /<button|<input|GOOGLE_CLIENT/);
    assert.match(agent, /Authorizing connects this agent to the Google account\./);
    assert.match(agent, /The agent can search, read, and edit that account's notes and diagrams\./);
    assert.equal(
      loginSendFailureSentence(undefined, "We could not open Google."),
      "We could not open Google.",
    );
    assert.match(example, /^GOOGLE_CLIENT_ID=$/m);
    assert.match(example, /^GOOGLE_CLIENT_SECRET=$/m);
    assert.match(example, /http:\/\/localhost:3000\/api\/auth\/callback\/google/);
    assert.match(example, /https:\/\/pamiac\.com\/api\/auth\/callback\/google/);
    assert.match(readme, /http:\/\/localhost:3000\/api\/auth\/callback\/google/);
    assert.match(readme, /https:\/\/pamiac\.com\/api\/auth\/callback\/google/);
    assert.doesNotMatch(readme, /vercel\.app/);
  });
});
