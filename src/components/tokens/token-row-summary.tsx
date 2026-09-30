import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenExpandCell } from "@/components/tokens/token-expand-cell";
import { formatTokenWhen } from "@/components/tokens/token-status";
import { TokenStatusCell } from "@/components/tokens/token-status-cell";

interface Properties {
  expanded: boolean;
  onToggle: () => void;
  token: AgentToken;
}

export function TokenRowSummary(props: Properties) {
  const { expanded, onToggle, token } = props;

  return (
    <tr>
      <td>{token.name}</td>
      <td>{token.tokenPrefix}</td>
      <td>{formatTokenWhen(token.lastUsedAt, "Never")}</td>
      <td>{formatTokenWhen(token.expiresAt, "No expiration")}</td>
      <TokenStatusCell token={token} />
      <TokenExpandCell expanded={expanded} onToggle={onToggle} />
    </tr>
  );
}
