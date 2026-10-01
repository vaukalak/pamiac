import type { AgentToken } from "@/components/tokens/agent-token";
import { tokenStatus } from "@/components/tokens/token-status";

interface Properties {
  token: AgentToken;
}

export function TokenStatusCell(props: Properties) {
  const { token } = props;
  const status = tokenStatus(token);

  return (
    <td>
      <span className={`token-status token-status-${status.toLowerCase()}`}>{status}</span>
    </td>
  );
}
