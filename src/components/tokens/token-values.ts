export { scopePayload, selectedSpaceIds } from "@/lib/token-scope";

export const EXPIRATIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "date", label: "Custom date" },
  { value: "never", label: "No expiration" },
] as const;

export const SCOPE_OPTIONS = [
  { value: "all", label: "All scopes" },
  { value: "selected", label: "Selected spaces" },
] as const;

export type Expiration = (typeof EXPIRATIONS)[number]["value"];
export type ScopeChoice = (typeof SCOPE_OPTIONS)[number]["value"];

export interface TokenValues {
  name: string;
  scope: ScopeChoice;
  spaces: Record<string, boolean>;
  expiration: Expiration;
  date: string;
}

export interface TokenUpdateValues {
  name: string;
  scope: ScopeChoice;
  spaces: Record<string, boolean>;
}
