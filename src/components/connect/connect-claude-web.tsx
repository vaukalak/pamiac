import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectClaudeMcpCopy } from "@/components/connect/connect-claude-mcp-copy";
import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { AGENT_SETUP_PROMPT, type ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectClaudeWeb(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-claude">
      <Paragraph className="token-connect-emphasis">No API key required</Paragraph>
      <ConnectChecklist items={platform.checklist} />
      <ConnectClaudeMcpCopy />
      <ConnectCopyAction
        failure="Could not copy the prompt."
        label="Copy agent setup prompt"
        success="Prompt copied."
        text={AGENT_SETUP_PROMPT}
      />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
