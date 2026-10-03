import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { AGENT_CONNECT_URL, AGENT_SETUP_PROMPT } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAgentSetup() {
  return (
    <div className="token-connect-agent">
      <h3>Let your agent configure Pamiac</h3>
      <Paragraph>Paste this into your AI agent and ask it to connect itself.</Paragraph>
      <ConnectPromptText text={AGENT_CONNECT_URL} />
      <ConnectCopyAction
        className="library-lime"
        failure="Could not copy the prompt."
        label="Copy setup prompt"
        success="Prompt copied."
        text={AGENT_SETUP_PROMPT}
      />
      <ConnectCopyAction
        failure="Could not copy the link."
        label="Copy link"
        success="Link copied."
        text={AGENT_CONNECT_URL}
      />
    </div>
  );
}
