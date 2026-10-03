import type { ConnectPlatformId } from "@/lib/connect-platforms";

export interface ConnectConsentRow {
  platform: Exclude<ConnectPlatformId, "other">;
  connectedAt: string | null;
}

export interface ConnectAccount {
  name: string;
  email: string;
  connections: ConnectConsentRow[];
}

export const connectConsentsQueryKey = ["connect", "agent"] as const;

async function fetchConnectAccount(): Promise<ConnectAccount> {
  const response = await fetch("/api/connect/agent");
  const body = (await response.json().catch(() => null)) as ConnectAccount | null;
  if (!response.ok || !body || !Array.isArray(body.connections)) {
    throw new Error("Could not load connections");
  }
  return {
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    connections: body.connections,
  };
}

export function connectConsentsQueryOptions() {
  return {
    queryKey: connectConsentsQueryKey,
    queryFn: fetchConnectAccount,
  };
}
