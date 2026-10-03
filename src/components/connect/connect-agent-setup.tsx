import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { AGENT_CONNECT_URL, AGENT_SETUP_PROMPT } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAgentSetup() {
  return (
    <div className="token-connect-agent">
      <Paragraph className="token-connect-or">OR LET YOUR AGENT DO IT</Paragraph>
      <h3>Let your agent configure Pamiac</h3>
      <Paragraph>Paste this into your AI agent and ask it to connect itself.</Paragraph>
      <ConnectPromptText text={AGENT_CONNECT_URL} />
      <ConnectCopyAction
        className="library-lime"
        label="Copy setup prompt"
        text={AGENT_SETUP_PROMPT}
      />
      <ConnectCopyAction label="Copy link" text={AGENT_CONNECT_URL} />
    </div>
  );
}
