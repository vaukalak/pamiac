import type { AgentToken } from "@/components/tokens/agent-token";
import { filterTokens as filterTokenRows, type TokenStatusFilter } from "@/lib/token-scope";

export type { TokenStatusFilter };

export interface TokenFilterValues {
  query: string;
  status: TokenStatusFilter;
}

export function filterTokens(
  tokens: readonly AgentToken[],
  query: string,
  status: TokenStatusFilter,
) {
  return filterTokenRows(tokens, query, status);
}
