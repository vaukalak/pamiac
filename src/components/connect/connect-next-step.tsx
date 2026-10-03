import { ConnectionSkillActions } from "@/components/tokens/connection-skill-actions";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  detail: string;
  skill?: boolean;
  title: string;
}

export function ConnectNextStep(props: Properties) {
  const { detail, skill = false, title } = props;

  return (
    <li className="token-connect-step">
      <Paragraph>{title}</Paragraph>
      <Paragraph>{detail}</Paragraph>
      {skill ? <ConnectionSkillActions /> : null}
    </li>
  );
}
