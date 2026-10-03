import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import { CLAUDE_CODE_INSTALL_COMMAND } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectClaudeCode(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-claude">
      <Paragraph className="token-connect-lead">
        Connect Pamiac to Claude Code using remote MCP.
      </Paragraph>
      <ConnectPromptText text={CLAUDE_CODE_INSTALL_COMMAND} />
      <ConnectCopyAction
        className="library-lime"
        copiedStatus="Claude Code command copied"
        label="Copy install command"
        text={CLAUDE_CODE_INSTALL_COMMAND}
      />
      <Paragraph>
        Run this command in your terminal. Claude Code will ask you to authenticate with Pamiac when
        needed.
      </Paragraph>
      <ConnectSetupPrompt
        detail="Paste this prompt into Claude Code."
        title="Let Claude Code configure itself"
      />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
