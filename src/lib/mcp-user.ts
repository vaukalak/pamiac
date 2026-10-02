import type { AgentScope } from "@/lib/documents";

function openScope(): AgentScope {
  return { allScopes: true, workspaceIds: [] };
}

export function accessTokenUserId(claims: { sub?: unknown }) {
  return typeof claims.sub === "string" ? claims.sub.trim() : "";
}

export function mcpRequestUserId(authInfo: { extra?: Record<string, unknown> } | undefined) {
  const userId = authInfo?.extra?.userId;
  return typeof userId === "string" ? userId.trim() : "";
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function mcpRequestScope(
  authInfo: { extra?: Record<string, unknown> } | undefined,
): AgentScope {
  const scope = authInfo?.extra?.scope;
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) return openScope();
  const record = scope as { allScopes?: unknown; workspaceIds?: unknown };
  if (typeof record.allScopes !== "boolean" || !isStringList(record.workspaceIds)) {
    return openScope();
  }
  return { allScopes: record.allScopes, workspaceIds: record.workspaceIds };
}
