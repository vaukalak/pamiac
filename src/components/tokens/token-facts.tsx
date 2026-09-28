import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenFact } from "@/components/tokens/token-fact";

interface Properties {
  token: AgentToken;
}

export function TokenFacts(props: Properties) {
  const { token } = props;
  const facts = [
    ["Prefix", `${token.tokenPrefix}…`],
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

function formatWhen(value: string) {
  return new Date(value).toLocaleString();
}
