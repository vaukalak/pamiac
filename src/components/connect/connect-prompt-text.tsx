import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  text: string;
}

export function ConnectPromptText(props: Properties) {
  const { text } = props;

  return <Paragraph className="token-connect-link-value">{text}</Paragraph>;
}
