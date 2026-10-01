import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenExpandedBody } from "@/components/tokens/token-expanded-body";
import { TokenFormDialog } from "@/components/tokens/token-form-dialog";

interface Properties {
  onClose: () => void;
  token: AgentToken;
}

export function TokenUpdateDialog(props: Properties) {
  const { onClose, token } = props;

  return (
    <TokenFormDialog onClose={onClose} title="Update API key">
      <TokenExpandedBody token={token} />
    </TokenFormDialog>
  );
}
