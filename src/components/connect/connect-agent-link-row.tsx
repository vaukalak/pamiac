import { AGENT_CONNECT_LABEL } from "@/lib/connect-platforms";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onCopy: () => void;
}

export function ConnectAgentLinkRow(props: Properties) {
  const { onCopy } = props;

  return (
    <div className="token-connect-link-row">
      <Paragraph className="token-connect-link-value">{AGENT_CONNECT_LABEL}</Paragraph>
      <Button className="secondary small" onClick={onCopy} type="button">
        Copy
      </Button>
    </div>
  );
}
