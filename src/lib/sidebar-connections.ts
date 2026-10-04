import { tokenStatus, type TokenLifecycle } from "./token-scope.ts";

export interface ScopedConnection extends TokenLifecycle {
  allScopes: boolean;
  workspaceIds: readonly string[];
}

export function liveConnection(token: TokenLifecycle, now = Date.now()) {
  return tokenStatus(token, now) === "Active";
}

export function tokenReachesWorkspace(
  token: ScopedConnection,
  workspaceId: string,
  now = Date.now(),
) {
  if (!liveConnection(token, now)) return false;
  if (token.allScopes) return true;
  return token.workspaceIds.includes(workspaceId);
}

export function liveConnectionCount(tokens: readonly TokenLifecycle[], now = Date.now()) {
  return tokens.filter((token) => liveConnection(token, now)).length;
}
