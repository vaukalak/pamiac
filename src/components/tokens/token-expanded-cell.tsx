import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenExpandedBody } from "@/components/tokens/token-expanded-body";

interface Properties {
  token: AgentToken;
}

export function TokenExpandedCell(props: Properties) {
  const { token } = props;

  return (
    <td colSpan={6}>
      <TokenExpandedBody token={token} />
    </td>
  );
}
