import assert from "node:assert/strict";
import test from "node:test";
import { isSafeRelativePath, safeNext } from "./config.ts";
import {
  consentLoginHref,
  oauthAuthorizeResumePath,
  oauthClientLabel,
  oauthConsentReturnPath,
  oauthLoginReturnPath,
  oauthRedirectTarget,
} from "./oauth-return.ts";

const authorizeQuery = new URLSearchParams({
  sig: "signed",
  client_id: "https://chatgpt.com/oauth/client.json",
  response_type: "code",
  redirect_uri: "https://chatgpt.com/connector/callback",
  code_challenge: "challenge",
  state: "state-1",
});

test("oauth login returns to a same-origin login path", () => {
  const path = oauthLoginReturnPath(authorizeQuery);
  assert.equal(path?.startsWith("/login?"), true);
  assert.equal(path?.includes("redirect_uri="), true);
  assert.equal(isSafeRelativePath(path ?? ""), true);
  assert.equal(path?.startsWith("//"), false);
});

test("oauth resume keeps repeated resource values", () => {
  const params = new URLSearchParams(authorizeQuery);
  params.append("resource", "https://pamiac.example/api/mcp");
  params.append("resource", "https://pamiac.example/api/mcp");
  const path = oauthAuthorizeResumePath(params);
  const resume = new URL(path ?? "", "https://pamiac.example");
  assert.deepEqual(resume.searchParams.getAll("resource"), [
    "https://pamiac.example/api/mcp",
    "https://pamiac.example/api/mcp",
  ]);
});

test("oauth resume stays on the authorize endpoint", () => {
  const path = oauthAuthorizeResumePath(authorizeQuery);
  assert.equal(path?.startsWith("/api/auth/oauth2/authorize?"), true);
  assert.equal(isSafeRelativePath(path ?? ""), true);
  assert.equal(path?.startsWith("https://"), false);
  const resume = new URL(path ?? "", "https://pamiac.example");
  assert.equal(resume.origin, "https://pamiac.example");
  assert.equal(resume.searchParams.get("redirect_uri"), "https://chatgpt.com/connector/callback");
  assert.equal(resume.searchParams.get("sig"), null);
});

test("missing oauth query does not resume", () => {
  assert.equal(oauthLoginReturnPath(new URLSearchParams({ next: "/workspace" })), null);
  assert.equal(oauthAuthorizeResumePath(new URLSearchParams({ client_id: "abc" })), null);
});

test("consent login preserves a relative return path", () => {
  const href = consentLoginHref(
    new URLSearchParams({ client_id: "chatgpt", scope: "openid email" }),
  );
  const next = new URL(href, "https://pamiac.example").searchParams.get("next");
  assert.equal(href.startsWith("/login?next="), true);
  assert.equal(next?.startsWith("/oauth/consent?"), true);
  assert.equal(safeNext(next), next);
});

test("safe next rejects external and protocol-relative urls", () => {
  assert.equal(safeNext("/workspace/tokens"), "/workspace/tokens");
  assert.equal(safeNext("//evil.example"), "/workspace");
  assert.equal(safeNext("https://evil.example"), "/workspace");
  assert.equal(safeNext("/\\evil.example"), "/workspace");
});

test("an unsafe consent query does not leave the app", () => {
  const params = new URLSearchParams();
  params.set("client_id", "chatgpt");
  params.set("next", "/\\evil.example");
  assert.equal(oauthConsentReturnPath(params).startsWith("/oauth/consent"), true);
  assert.equal(isSafeRelativePath(oauthConsentReturnPath(params)), true);
});

test("consent redirect targets are http(s), the Cursor callback, or a relative path", () => {
  assert.equal(
    oauthRedirectTarget({ url: "https://chatgpt.com/connector/callback?code=1" }),
    "https://chatgpt.com/connector/callback?code=1",
  );
  assert.equal(
    oauthRedirectTarget({
      url: "cursor://anysphere.cursor-mcp/oauth/callback?code=1&state=s",
    }),
    "cursor://anysphere.cursor-mcp/oauth/callback?code=1&state=s",
  );
  assert.equal(oauthRedirectTarget({ url: "/oauth/consent" }), "/oauth/consent");
  assert.equal(oauthRedirectTarget({ url: "javascript:alert(1)" }), null);
  assert.equal(oauthRedirectTarget({ url: "//evil.example" }), null);
  assert.equal(oauthRedirectTarget({ url: "data:text/html,hi" }), null);
  assert.equal(oauthRedirectTarget({ url: "cursor://evil.example/oauth/callback" }), null);
  assert.equal(
    oauthRedirectTarget({
      url: "cursor://anysphere.cursor-mcp/oauth/callback#code",
    }),
    null,
  );
  assert.equal(oauthRedirectTarget(null), null);
});

test("client label uses the metadata host when the client id is a url", () => {
  assert.equal(oauthClientLabel("https://chatgpt.com/oauth/client.json"), "chatgpt.com");
  assert.equal(oauthClientLabel("chatgpt"), "chatgpt");
  assert.equal(oauthClientLabel("  "), "This application");
});
