import type { AgentToken } from "@/components/tokens/agent-token";

export const tokensQueryKey = ["tokens"] as const;

export async function fetchTokens(): Promise<AgentToken[]> {
  const response = await fetch("/api/tokens");
  const body = (await response.json().catch(() => null)) as {
    tokens?: AgentToken[];
    error?: string;
  } | null;
  if (!response.ok || !body?.tokens) {
    throw new Error(body?.error ?? "Could not load API keys");
  }
  return body.tokens;
}

export function tokensQueryOptions() {
  return {
    queryKey: tokensQueryKey,
    queryFn: fetchTokens,
  };
}
