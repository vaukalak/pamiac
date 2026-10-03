import { ConnectApiToken } from "@/components/connect/connect-api-token";
import { ConnectManualMcp } from "@/components/connect/connect-manual-mcp";
import { ConnectionAgent } from "@/components/tokens/connection-agent";
import type { ConnectionTabId } from "@/components/tokens/connection-tabs";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  onGuides: () => void;
  platformId: ConnectPlatformId;
  tab: ConnectionTabId;
}

export function ConnectionPanel(props: Properties) {
  const { onGuides, platformId, tab } = props;
  if (tab === "token") return <ConnectApiToken onGuides={onGuides} platformId={platformId} />;
  if (tab === "mcp") return <ConnectManualMcp />;
  return <ConnectionAgent />;
}
