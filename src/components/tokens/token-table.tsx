import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenTableSheet } from "@/components/tokens/token-table-sheet";

interface Properties {
  tokens: AgentToken[];
}

export function TokenTable(props: Properties) {
  const { tokens } = props;

  return (
    <div className="token-table-wrap">
      <TokenTableSheet tokens={tokens} />
    </div>
  );
}
