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
      <Button className="secondary small token-connect-copy" onClick={onCopy} type="button">
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <rect height="9" rx="1.5" width="9" x="5" y="5" />
          <path d="M4 11V3.5A1.5 1.5 0 0 1 5.5 2H11" />
        </svg>
        <span className="token-connect-sr">Copy</span>
      </Button>
    </div>
  );
}
