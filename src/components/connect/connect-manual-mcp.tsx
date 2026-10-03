import { ConnectionMcpEndpoint } from "@/components/tokens/connection-mcp-endpoint";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onCreateToken: () => void;
}

export function ConnectManualMcp(props: Properties) {
  const { onCreateToken } = props;

  return (
    <div className="token-connect-mcp">
      <h3>Manual MCP</h3>
      <Paragraph>
        Use this when your AI tool supports remote MCP but does not have a Pamiac setup button.
      </Paragraph>
      <ConnectionMcpEndpoint />
      <Paragraph>Use Pamiac OAuth when your client supports it.</Paragraph>
      <Paragraph>
        If your client cannot use OAuth, create an API token and send it as an Authorization bearer
        token.
      </Paragraph>
      <Button className="secondary" onClick={onCreateToken} type="button">
        Create API token
      </Button>
    </div>
  );
}
