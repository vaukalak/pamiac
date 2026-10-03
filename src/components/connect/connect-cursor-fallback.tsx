import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onManual: () => void;
}

export function ConnectCursorFallback(props: Properties) {
  const { onManual } = props;

  return (
    <div className="token-connect-claude-mcp">
      <Paragraph>Cursor didn&apos;t open? Copy the MCP URL and add Pamiac manually.</Paragraph>
      <ConnectMcpCopy className="secondary" />
      <Button className="secondary" onClick={onManual} type="button">
        Show manual setup
      </Button>
    </div>
  );
}
