export const NATIVE_PRIVATE_USE_REDIRECT_CHECK =
  "if (FORBIDDEN_NATIVE_REDIRECT_SCHEMES.has(url.protocol) || !isReverseDomainPrivateUseRedirectUri(url)) invalidRedirectUri(`native private-use redirect URI schemes must be well-formed reverse-domain names, omit the naming authority, and must not use a reserved scheme: ${redirectUri}`);";

export const CURSOR_NATIVE_CALLBACK_ALLOWLIST =
  'if (redirectUri === "cursor://anysphere.cursor-mcp/oauth/callback") return;';

export function patchCursorNativeRedirectBundle(source: string) {
  if (source.includes(CURSOR_NATIVE_CALLBACK_ALLOWLIST)) return source;
  if (!source.includes(NATIVE_PRIVATE_USE_REDIRECT_CHECK)) return source;
  return source.replaceAll(NATIVE_PRIVATE_USE_REDIRECT_CHECK, (match, offset) => {
    const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
    const indent = source.slice(lineStart, offset);
    const prefix = /^[ \t]*$/.test(indent) ? indent : "";
    return `${CURSOR_NATIVE_CALLBACK_ALLOWLIST}\n${prefix}${match}`;
  });
}
