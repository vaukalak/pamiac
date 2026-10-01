export type TokenScopeChoice = "all" | "selected";

export type TokenLifecycle = {
  name: string;
  tokenPrefix: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type TokenStatusName = "Active" | "Expired" | "Revoked";

export function tokenStatus(token: TokenLifecycle, now = Date.now()): TokenStatusName {
  if (token.revokedAt) return "Revoked";
  if (token.expiresAt && Date.parse(token.expiresAt) <= now) return "Expired";
  return "Active";
}

export function formatTokenWhen(value: string | null, empty: string) {
  if (!value) return empty;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return empty;
  return parsed.toLocaleString();
}

export type TokenStatusFilter = "all" | TokenStatusName;

export function filterTokens<Token extends TokenLifecycle>(
  tokens: readonly Token[],
  query: string,
  status: TokenStatusFilter,
  now = Date.now(),
) {
  const needle = query.trim().toLocaleLowerCase("en");
  return tokens.filter((token) => {
    if (status !== "all" && tokenStatus(token, now) !== status) return false;
    if (!needle) return true;
    const name = token.name.toLocaleLowerCase("en");
    const prefix = token.tokenPrefix.toLocaleLowerCase("en");
    return name.includes(needle) || prefix.includes(needle);
  });
}

export function scopePayload(scope: TokenScopeChoice, spaces: Record<string, boolean>) {
  if (scope === "all") return { all: true as const };
  const workspaceIds = Object.entries(spaces)
    .filter((entry) => entry[1])
    .map((entry) => entry[0]);
  return { all: false as const, workspaceIds };
}

export function selectedSpaceIds(spaces: Record<string, boolean>) {
  return Object.entries(spaces)
    .filter((entry) => entry[1])
    .map((entry) => entry[0]);
}
