import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

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

describe("email and password sign-in", () => {
  it("opens the magic-link and password forms from the chooser without sending mail", () => {
    const form = read("src/components/login-form.tsx");
    const chooser = read("src/components/login/login-chooser.tsx");
    const magic = read("src/components/login/login-magic-link-form.tsx");
    const sentCard = slice(magic, "{sent ? (", ") : (");

    expect(chooser).toMatch(/Send Magic Link/);
    expect(chooser).toMatch(/onClick=\{onMagicLink\}/);
    expect(chooser).toMatch(/Or continue with email \/ password/);
    expect(chooser).toMatch(/onClick=\{onPassword\}/);
    expect(chooser).not.toMatch(/authClient\.signIn\.magicLink|authClient\.signIn\.email/);
    expect(form).toMatch(/setStep\("chooser"\)/);
    expect(form).toMatch(/setStep\("magic"\)/);
    expect(form).toMatch(/setStep\("password"\)/);
    expect(magic).toMatch(/authClient\.signIn\.magicLink\(/);
    expect(magic).toMatch(/>\s*Back\s*</);
    expect(sentCard).toMatch(/<LoginLinkSent/);
    expect(sentCard).not.toMatch(/Back|LoginGoogle|Send Magic Link/);
  });

  it("signs in with email and password and does not register", () => {
    const fields = read("src/components/login/login-password-form.tsx");

    expect(fields).toMatch(/"Enter an email address\."/);
    expect(fields).toMatch(/"That address needs an @\."/);
    expect(fields).toMatch(/"Enter a password\."/);
    expect(fields).toMatch(/authClient\.signIn\.email\(\{/);
    expect(fields).toMatch(/callbackURL: nextPath/);
    expect(fields).toMatch(/"That email or password did not match\."/);
    expect(fields).toMatch(/loginSendFailureSentence\(/);
    expect(fields).not.toMatch(/We could not send the link|magic link/i);
    expect(fields).toMatch(
      /<Form\.Input[^>]*autoComplete="email"[^>]*label="Email"[^>]*type="email"/s,
    );
    expect(fields).toMatch(
      /<Form\.Input[^>]*autoComplete="current-password"[^>]*label="Password"[^>]*type="password"/s,
    );
    expect(fields).toMatch(/disabled=\{mutation\.isPending\}/);
    expect(fields).toMatch(/>\s*Sign in\s*</);
    expect(fields).toMatch(/>\s*reset password\s*</);
    expect(fields).toMatch(/authClient\.requestPasswordReset\(\{/);
    expect(fields).toMatch(/redirectTo: "\/reset-password"/);
    expect(fields).toMatch(
      /<Button[^>]*className="ghost"[^>]*type="button"[^>]*>\s*reset password\s*<\/Button>/s,
    );
    expect(fields).toMatch(/>\s*Back\s*</);
    expect(fields).toMatch(/<LoginSendFailure happened=\{message\} \/>/);
    expect(fields).not.toMatch(/useState|<input|<select|signUp/);
  });

  it("switches Google connect to the password form and back, without a magic link", () => {
    const signIn = read("src/components/connect/google-connect-sign-in.tsx");

    expect(signIn).toMatch(/Google sign-in is not set up\./);
    expect(signIn).toMatch(/<LoginGoogle agentConnect nextPath=\{nextPath\} \/>/);
    expect(signIn).toMatch(/Or continue with email \/ password/);
    expect(signIn).toMatch(/<LoginPasswordForm/);
    expect(signIn).toMatch(/setShowPassword\(false\)/);
    expect(signIn).toMatch(/const nextPath = googleConnectPath\(userCode\)/);
    expect(signIn).not.toMatch(/magicLink|LoginForm|Send Magic Link|<input|signUp/);
  });

  it("enables password sign-in without a public sign-up", () => {
    const auth = read("src/lib/auth.ts");
    const client = read("src/lib/auth-client.ts");
    const copy = read("src/components/login/login-sign-in-copy.tsx");

    expect(auth).toMatch(/enabled:\s*true/);
    expect(auth).toMatch(/disableSignUp:\s*true/);
    expect(auth).toMatch(/resetPasswordTokenExpiresIn:\s*60 \* 60/);
    expect(auth).toMatch(/sendResetPassword:\s*async/);
    expect(auth).toMatch(/sendPasswordReset\(\{ email: user\.email, url \}\)/);
    expect(client).not.toMatch(/signUp\.email/);
    expect(copy).toMatch(/title="Sign in or register"/);
    expect(copy).toMatch(
      /We email you a link\. If the address is new, opening the link creates the account\./,
    );
    expect(copy).not.toMatch(/There is no password/);
  });

  it("seeds the review user with a hash and does not replace an existing credential", () => {
    const sql = read("drizzle/0007_openai-review-user.sql");
    const journal = read("drizzle/meta/_journal.json");

    expect(sql).toMatch(/ON CONFLICT \("email"\) DO NOTHING/);
    expect(sql).toMatch(/'user_openai_review'/);
    expect(sql).toMatch(/'OpenAI Review'/);
    expect(sql).toMatch(/'openaireview@pamiac.com'/);
    expect(sql).toMatch(/'account_openai_review'/);
    expect(sql).toMatch(/'credential'/);
    expect(sql).toMatch(/"user"\."id"/);
    expect(sql).toMatch(/provider_id" = 'credential'/);
    expect(sql).toMatch(/NOT EXISTS/);
    expect(sql).not.toMatch(/AAAaaa1!|ON CONFLICT \("id"\) DO UPDATE|password" =/);
    expect(sql).toMatch(/[0-9a-f]{32}:[0-9a-f]{128}/);
    expect(journal).toMatch(/"idx": 7/);
    expect(journal).toMatch(/"tag": "0007_openai-review-user"/);
    expect(journal).toMatch(/"when": 1790810600000/);
  });

  it("opens the sent magic-link card when an address is already remembered", () => {
    const form = read("src/components/login-form.tsx");
    const restore = slice(form, "useLayoutEffect", 'if (step === "magic")');
    const passwordStep = slice(form, 'if (step === "password")', "<LoginChooser");

    expect(restore).toMatch(/readSentLoginAddress\(\)/);
    expect(restore).toMatch(/setStep\("magic"\)/);
    expect(passwordStep).toMatch(/<LoginPasswordForm/);
    expect(passwordStep).toMatch(/setStep\("chooser"\)/);
    expect(passwordStep).not.toMatch(/LoginChooser|LoginMagicLinkForm|LoginGoogle|Send Magic Link/);
  });

  it("keeps Google connect's password screen to the password form", () => {
    const signIn = read("src/components/connect/google-connect-sign-in.tsx");
    const passwordScreen = slice(signIn, "if (showPassword)", "<>");
    const idle = signIn.slice(signIn.lastIndexOf("return ("));
    const fields = read("src/components/login/login-password-form.tsx");

    expect(passwordScreen).toMatch(/<LoginPasswordForm/);
    expect(passwordScreen).toMatch(/setShowPassword\(false\)/);
    expect(passwordScreen).not.toMatch(
      /LoginGoogle|Send Magic Link|Or continue with email|magicLink/,
    );
    expect(idle).toMatch(/<LoginGoogle agentConnect nextPath=\{nextPath\} \/>/);
    expect(idle).toMatch(/Google sign-in is not set up\./);
    expect(idle).toMatch(/Or continue with email \/ password/);
    expect(idle).toMatch(/setShowPassword\(true\)/);
    expect(idle).not.toMatch(/LoginPasswordForm|Send Magic Link|magicLink/);
    expect(fields).not.toMatch(/Use at least 8 characters|signUp|window\.location\.assign/);
    expect(fields).toMatch(/className="ghost"[^>]*type="button"/);
  });
});
