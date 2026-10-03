import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectGeminiSetup(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph className="token-connect-lead">
        Add Pamiac as a custom MCP app in Gemini.
      </Paragraph>
      <ConnectMcpCopy />
      <Paragraph>In Gemini, add a custom connected app and paste the Pamiac MCP URL.</Paragraph>
      <Paragraph>Custom MCP apps may not be available on every Gemini account yet.</Paragraph>
      <ConnectSetupPrompt />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
