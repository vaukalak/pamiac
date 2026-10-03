import { ConnectApiToken } from "@/components/connect/connect-api-token";
import { ConnectManualMcp } from "@/components/connect/connect-manual-mcp";
import { ConnectionAgent } from "@/components/tokens/connection-agent";
import type { ConnectionTabId } from "@/components/tokens/connection-tabs";

interface Properties {
  onGuides: () => void;
  tab: ConnectionTabId;
}

export function ConnectionPanel(props: Properties) {
  const { onGuides, tab } = props;
  if (tab === "token") return <ConnectApiToken onGuides={onGuides} />;
  if (tab === "mcp") return <ConnectManualMcp />;
  return <ConnectionAgent />;
}
