import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectChatGptPending(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph>
        Pamiac for ChatGPT is awaiting directory approval. You can connect it manually now.
      </Paragraph>
      <Paragraph className="token-connect-lead">
        Add Pamiac as an MCP connection in ChatGPT and authenticate with your Pamiac account.
      </Paragraph>
      <ConnectMcpCopy />
      <Paragraph>
        Add Pamiac using the MCP URL above. ChatGPT will ask you to sign in with Pamiac when
        authentication is required.
      </Paragraph>
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
