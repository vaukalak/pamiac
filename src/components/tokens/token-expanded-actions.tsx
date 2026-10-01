import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenRevoke } from "@/components/tokens/token-revoke";
import { TokenUpdateForm } from "@/components/tokens/token-update-form";

interface Properties {
  token: AgentToken;
}

export function TokenExpandedActions(props: Properties) {
  const { token } = props;
  if (token.revokedAt) return null;

  return (
    <>
      <TokenUpdateForm token={token} />
      <TokenRevoke id={token.id} />
    </>
  );
}
