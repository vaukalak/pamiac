"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenFact } from "@/components/tokens/token-fact";
import { librarySpaces, type LibrarySpace } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  token: AgentToken;
}

export function TokenFacts(props: Properties) {
  const { token } = props;
  const spaces = useQuery(workspacesQueryOptions());
  const facts = [
    ["Prefix", `${token.tokenPrefix}…`],
    ["Workspace", boundWorkspaceName(token.workspaceId, librarySpaces(spaces.data ?? []))],
    ["Created", formatWhen(token.createdAt)],
    ["Last used", token.lastUsedAt ? formatWhen(token.lastUsedAt) : "Never used"],
    ["Expiration", token.expiresAt ? formatWhen(token.expiresAt) : "No expiration"],
    ["Status", token.revokedAt ? "Revoked" : "Active"],
  ] as const;

  return (
    <dl className="token-facts">
      {facts.map(([label, value]) => (
        <TokenFact key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

function boundWorkspaceName(workspaceId: string | null, spaces: readonly LibrarySpace[]) {
  if (!workspaceId) return "Personal space";
  const label = spaces.find((space) => space.id === workspaceId)?.label.trim() ?? "";
  if (!label) return "Workspace";
  return label;
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString();
}
