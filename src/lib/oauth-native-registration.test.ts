import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isNativeAcceptableRedirectUri,
  prepareOauthRegisterRequest,
  rewriteNativeRegistrationBody,
} from "./oauth-native-registration.ts";

const cursorRedirects = [
  "cursor://anysphere.cursor-mcp/oauth/callback",
  "https://www.cursor.com/agents/mcp/oauth/callback",
  "http://localhost:8787/callback",
];

function encode(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value));
}

function decode(body: Uint8Array | null) {
  assert.ok(body);
  return JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
}

describe("native OAuth registration rewrite", () => {
  it("sets application_type to native for Cursor's omitted type and three redirects", () => {
    const registration = {
      redirect_uris: cursorRedirects,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };

    const rewritten = decode(rewriteNativeRegistrationBody(encode(registration)));

    assert.equal(rewritten.application_type, "native");
    assert.deepEqual(rewritten.redirect_uris, registration.redirect_uris);
    assert.deepEqual(rewritten.grant_types, registration.grant_types);
    assert.deepEqual(rewritten.response_types, registration.response_types);
    assert.equal(rewritten.token_endpoint_auth_method, "none");
  });

  it("sets an explicit web client with only the cursor callback to native", () => {
    const rewritten = decode(
      rewriteNativeRegistrationBody(
        encode({
          application_type: "web",
          redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback"],
          client_name: "Cursor",
        }),
      ),
    );

    assert.equal(rewritten.application_type, "native");
    assert.equal(rewritten.client_name, "Cursor");
  });

  it("leaves an already native registration unchanged", () => {
    const body = encode({
      application_type: "native",
      redirect_uris: cursorRedirects,
    });

    assert.equal(rewriteNativeRegistrationBody(body), null);
  });

  it("leaves an https-only web registration unchanged", () => {
    const raw = JSON.stringify({
      application_type: "web",
      redirect_uris: ["https://www.cursor.com/agents/mcp/oauth/callback"],
    });

    assert.equal(rewriteNativeRegistrationBody(new TextEncoder().encode(raw)), null);
  });

  it("leaves a cursor callback mixed with http://evil.example unchanged", () => {
    const body = encode({
      redirect_uris: [
        "cursor://anysphere.cursor-mcp/oauth/callback",
        "http://evil.example/callback",
      ],
    });

    assert.equal(rewriteNativeRegistrationBody(body), null);
  });

  it("passes a non-JSON register body and a non-register POST through unchanged", async () => {
    const register = new Request("https://pamiac.example/api/auth/oauth2/register", {
      method: "POST",
      body: "not-json",
    });
    const preparedRegister = await prepareOauthRegisterRequest(register);
    assert.equal(await preparedRegister.text(), "not-json");

    const other = new Request("https://pamiac.example/api/auth/oauth2/token", {
      method: "POST",
      body: JSON.stringify({ redirect_uris: cursorRedirects }),
    });
    const preparedOther = await prepareOauthRegisterRequest(other);
    assert.equal(preparedOther, other);
    assert.equal(await other.text(), JSON.stringify({ redirect_uris: cursorRedirects }));
  });

  it("keeps the original bytes when a register body is not rewritten", async () => {
    const raw = ' { "application_type": "web", "redirect_uris": ["https://example.com/cb"] } ';
    const request = new Request("https://pamiac.example/api/auth/oauth2/register?client=cursor", {
      method: "POST",
      body: raw,
    });
    const prepared = await prepareOauthRegisterRequest(request);
    assert.equal(await prepared.text(), raw);
  });

  it("rewrites a register POST when the path has a query string", async () => {
    const request = new Request("https://pamiac.example/api/auth/oauth2/register?x=1", {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "reg-1" },
      body: JSON.stringify({ redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback"] }),
    });
    const prepared = await prepareOauthRegisterRequest(request);
    const text = await prepared.text();
    assert.equal(prepared.headers.get("x-request-id"), "reg-1");
    assert.equal(prepared.headers.get("content-type"), "application/json");
    assert.equal(
      prepared.headers.get("content-length"),
      String(new TextEncoder().encode(text).byteLength),
    );
    assert.equal(JSON.parse(text).application_type, "native");
  });

  it("does not read a GET to the register path", async () => {
    const request = new Request("https://pamiac.example/api/auth/oauth2/register", {
      method: "GET",
    });
    assert.equal(await prepareOauthRegisterRequest(request), request);
  });

  it("does not coerce credentials, fragments, other cursor URIs, or non-objects", () => {
    const rejected = [
      { redirect_uris: ["https://user:pass@example.com/cb"] },
      { redirect_uris: ["https://example.com/cb#fragment"] },
      { redirect_uris: ["cursor://other/path"] },
      { redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback", "https://127.0.0.1/cb"] },
      { redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback", "https://[::1]/cb"] },
      { redirect_uris: ["http://127.0.0.2/cb"] },
      { redirect_uris: ["http://localhost./cb"] },
      { redirect_uris: ["http://user@localhost/cb"] },
      { redirect_uris: [] },
      { application_type: null, redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback"] },
      { redirect_uris: ["cursor://anysphere.cursor-mcp/oauth/callback", 1] },
    ];
    for (const registration of rejected) {
      assert.equal(rewriteNativeRegistrationBody(encode(registration)), null);
    }
    assert.equal(
      rewriteNativeRegistrationBody(encode(["cursor://anysphere.cursor-mcp/oauth/callback"])),
      null,
    );
    assert.equal(rewriteNativeRegistrationBody(encode(null)), null);
  });

  it("accepts exact http loopback hosts together with an ordinary https redirect", () => {
    const rewritten = decode(
      rewriteNativeRegistrationBody(
        encode({
          application_type: "web",
          redirect_uris: [
            "https://www.cursor.com/agents/mcp/oauth/callback",
            "http://127.0.0.1:8787/callback",
            "http://[::1]:8787/callback",
          ],
          grant_types: ["authorization_code"],
        }),
      ),
    );
    assert.equal(rewritten.application_type, "native");
    assert.deepEqual(rewritten.grant_types, ["authorization_code"]);
  });

  it("does not treat javascript: or file: URIs as the cursor callback", () => {
    assert.equal(isNativeAcceptableRedirectUri("javascript:alert(1)"), false);
    assert.equal(isNativeAcceptableRedirectUri("file:///tmp/callback"), false);
    assert.equal(
      isNativeAcceptableRedirectUri("javascript:cursor://anysphere.cursor-mcp/oauth/callback"),
      false,
    );
    assert.equal(
      rewriteNativeRegistrationBody(encode({ redirect_uris: ["javascript:alert(1)"] })),
      null,
    );
    assert.equal(
      rewriteNativeRegistrationBody(encode({ redirect_uris: ["file:///tmp/callback"] })),
      null,
    );
  });
});
