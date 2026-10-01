import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenExpandedActions } from "@/components/tokens/token-expanded-actions";
import { formatTokenWhen } from "@/components/tokens/token-status";
import { TokenViewSetup } from "@/components/tokens/token-view-setup";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  token: AgentToken;
}

export function TokenExpandedBody(props: Properties) {
  const { token } = props;

  return (
    <div className="token-expanded">
      <Paragraph>Created {formatTokenWhen(token.createdAt, "Unknown")}</Paragraph>
      <TokenViewSetup />
      <TokenExpandedActions token={token} />
    </div>
  );
}
