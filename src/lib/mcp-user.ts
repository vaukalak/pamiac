export function accessTokenUserId(claims: { sub?: unknown }) {
  return typeof claims.sub === "string" ? claims.sub.trim() : "";
}

export function mcpRequestUserId(authInfo: { extra?: Record<string, unknown> } | undefined) {
  const userId = authInfo?.extra?.userId;
  return typeof userId === "string" ? userId.trim() : "";
}
