import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { AGENT_SETUP_PROMPT, COPY_SETUP_PROMPT_LABEL } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  detail?: string;
  title?: string;
}

export function ConnectSetupPrompt(props: Properties) {
  const { detail, title } = props;

  return (
    <Section className="token-connect-self token-connect-self-framed">
      {title ? <h3>{title}</h3> : null}
      {detail ? <Paragraph>{detail}</Paragraph> : null}
      <ConnectPromptText text={AGENT_SETUP_PROMPT} />
      <ConnectCopyAction label={COPY_SETUP_PROMPT_LABEL} text={AGENT_SETUP_PROMPT} />
    </Section>
  );
}
