import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenEmpty } from "@/components/tokens/token-empty";
import { TokenTable } from "@/components/tokens/token-table";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  error: string | null;
  filtered: boolean;
  pending: boolean;
  tokens: AgentToken[];
}

export function TokenKeysBody(props: Properties) {
  const { error, filtered, pending, tokens } = props;
  if (pending) return <Paragraph>Loading keys.</Paragraph>;
  if (error) return <Alert>{error}</Alert>;
  if (tokens.length === 0) return <TokenEmpty filtered={filtered} />;
  return <TokenTable tokens={tokens} />;
}
