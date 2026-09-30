import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenExpandedCell } from "@/components/tokens/token-expanded-cell";

interface Properties {
  token: AgentToken;
}

export function TokenRowExpanded(props: Properties) {
  const { token } = props;

  return (
    <tr className="token-row-expanded">
      <TokenExpandedCell token={token} />
    </tr>
  );
}
