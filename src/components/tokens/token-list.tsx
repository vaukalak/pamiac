import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenRow } from "@/components/tokens/token-row";

interface Properties {
  tokens: AgentToken[];
  onRevoked: () => void;
}

export function TokenList(props: Properties) {
  const { tokens, onRevoked } = props;
  if (tokens.length === 0) {
    return <p className="empty">No API keys yet. Create one and hand it to an agent.</p>;
  }

  return (
    <div className="token-list">
      {tokens.map((token) => (
        <TokenRow key={token.id} onRevoked={onRevoked} token={token} />
      ))}
    </div>
  );
}
