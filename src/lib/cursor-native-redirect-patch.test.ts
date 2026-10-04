import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CURSOR_NATIVE_CALLBACK_ALLOWLIST,
  NATIVE_PRIVATE_USE_REDIRECT_CHECK,
  patchCursorNativeRedirectBundle,
} from "./cursor-native-redirect-patch.ts";

const webBranch =
  'if (applicationType === "web") {\n\t\tif (!isHttps || isRedirectLoopback) invalidRedirectUri(`web clients require https redirect URIs on non-loopback hosts: ${redirectUri}`);\n\t\treturn;\n\t}\n';

describe("Cursor native redirect bundle patch", () => {
  it("inserts the allowlist once and is idempotent", () => {
    const source = `${webBranch}\t${NATIVE_PRIVATE_USE_REDIRECT_CHECK}\n`;
    const patched = patchCursorNativeRedirectBundle(source);

    assert.equal(
      patched,
      `${webBranch}\t${CURSOR_NATIVE_CALLBACK_ALLOWLIST}\n\t${NATIVE_PRIVATE_USE_REDIRECT_CHECK}\n`,
    );
    assert.equal(patched.split(CURSOR_NATIVE_CALLBACK_ALLOWLIST).length - 1, 1);
    assert.equal(patchCursorNativeRedirectBundle(patched), patched);
    assert.match(patched, /invalidRedirectUri\(`native private-use redirect URI schemes/);
    assert.match(patched, /web clients require https redirect URIs on non-loopback hosts/);
  });

  it("patches every native check in one bundle and ignores unrelated sources", () => {
    const source = `\t${NATIVE_PRIVATE_USE_REDIRECT_CHECK}\n\t${NATIVE_PRIVATE_USE_REDIRECT_CHECK}\n`;
    const patched = patchCursorNativeRedirectBundle(source);
    assert.equal(patched.split(CURSOR_NATIVE_CALLBACK_ALLOWLIST).length - 1, 2);
    assert.equal(patchCursorNativeRedirectBundle(patched), patched);
    const unrelated =
      'if (applicationType === "web") invalidRedirectUri(`web clients require https`);\n';
    assert.equal(patchCursorNativeRedirectBundle(unrelated), unrelated);
  });
});
