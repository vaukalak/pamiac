import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenFacts } from "@/components/tokens/token-facts";

interface Properties {
  token: AgentToken;
}

export function TokenIdentity(props: Properties) {
  const { token } = props;

  return (
    <div>
      <strong>{token.name}</strong>
      <TokenFacts token={token} />
    </div>
  );
}
