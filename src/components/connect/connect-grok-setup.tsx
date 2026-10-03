import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectGrokSetup(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph className="token-connect-lead">
        Add Pamiac as a custom connector in Grok.
      </Paragraph>
      <ConnectMcpCopy />
      <Paragraph>Create a custom connector in Grok and use the Pamiac MCP URL.</Paragraph>
      <ConnectSetupPrompt />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
