import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectOtherSetup(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph className="token-connect-lead">
        Pamiac works with agents that support remote MCP.
      </Paragraph>
      <ConnectMcpCopy />
      <ConnectSetupPrompt
        detail="Paste this prompt into your agent."
        title="Let your agent configure itself"
      />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
