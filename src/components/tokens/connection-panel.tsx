import { ConnectionAgent } from "@/components/tokens/connection-agent";
import { ConnectionChatGpt } from "@/components/tokens/connection-chatgpt";
import { ConnectionMcp } from "@/components/tokens/connection-mcp";
import type { ConnectionTabId } from "@/components/tokens/connection-tabs";

interface Properties {
  tab: ConnectionTabId;
}

export function ConnectionPanel(props: Properties) {
  const { tab } = props;
  if (tab === "agent") return <ConnectionAgent />;
  if (tab === "mcp") return <ConnectionMcp />;
  return <ConnectionChatGpt />;
}
