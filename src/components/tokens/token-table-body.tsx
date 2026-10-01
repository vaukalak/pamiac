import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenRow } from "@/components/tokens/token-row";

interface Properties {
  tokens: AgentToken[];
}

export function TokenTableBody(props: Properties) {
  const { tokens } = props;

  return (
    <tbody>
      {tokens.map((token) => (
        <TokenRow key={token.id} token={token} />
      ))}
    </tbody>
  );
}
