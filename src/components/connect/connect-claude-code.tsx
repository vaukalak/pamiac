import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { AGENT_SETUP_PROMPT, type ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectClaudeCode(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-claude">
      <ConnectChecklist items={platform.checklist} />
      <Paragraph>Paste this prompt into Claude.</Paragraph>
      <ConnectPromptText text={AGENT_SETUP_PROMPT} />
      <ConnectCopyAction
        className="library-lime"
        failure="Could not copy the prompt."
        label="Copy agent setup prompt"
        success="Prompt copied."
        text={AGENT_SETUP_PROMPT}
      />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
