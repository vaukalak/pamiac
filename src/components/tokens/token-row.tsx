import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenIdentity } from "@/components/tokens/token-identity";
import { TokenRevoke } from "@/components/tokens/token-revoke";

interface Properties {
  token: AgentToken;
  onRevoked: () => void;
}

export function TokenRow(props: Properties) {
  const { token, onRevoked } = props;

  return (
    <article className="token-row">
      <TokenIdentity token={token} />
      {token.revokedAt ? null : <TokenRevoke id={token.id} onRevoked={onRevoked} />}
    </article>
  );
}
