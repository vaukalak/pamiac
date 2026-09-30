import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenTableBody } from "@/components/tokens/token-table-body";
import { TokenTableHead } from "@/components/tokens/token-table-head";

interface Properties {
  tokens: AgentToken[];
}

export function TokenTableSheet(props: Properties) {
  const { tokens } = props;

  return (
    <table className="token-table">
      <TokenTableHead />
      <TokenTableBody tokens={tokens} />
    </table>
  );
}
