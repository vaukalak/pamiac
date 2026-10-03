import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectClaudeWeb(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-claude">
      <Paragraph className="token-connect-lead">
        Add Pamiac as a custom connector and sign in with your Pamiac account.
      </Paragraph>
      <ConnectChecklist items={platform.checklist} />
      <Paragraph>
        In Claude, add a custom connector and paste the Pamiac MCP URL. Claude will ask you to sign
        in when needed.
      </Paragraph>
      <ConnectMcpCopy />
      <ConnectSetupPrompt title="Using an agent to configure Claude?" />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
