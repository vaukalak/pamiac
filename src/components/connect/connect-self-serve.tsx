import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import {
  AGENT_SETUP_PROMPT,
  COPY_SETUP_PROMPT_LABEL,
  type ConnectPlatform,
} from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  framed?: boolean;
  platform: ConnectPlatform;
}

export function ConnectSelfServe(props: Properties) {
  const { framed = false, platform } = props;

  return (
    <div className={framed ? "token-connect-self token-connect-self-framed" : "token-connect-self"}>
      {platform.showOr ? <Paragraph className="token-connect-or">OR</Paragraph> : null}
      <h3>{platform.selfServe}</h3>
      <Paragraph>{`Paste this prompt into ${platform.name}.`}</Paragraph>
      <ConnectPromptText text={AGENT_SETUP_PROMPT} />
      <ConnectCopyAction label={COPY_SETUP_PROMPT_LABEL} text={AGENT_SETUP_PROMPT} />
    </div>
  );
}
