import { ConnectionMcpEndpoint } from "@/components/tokens/connection-mcp-endpoint";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectManualMcp() {
  return (
    <div className="token-connect-mcp">
      <Paragraph>
        Publisher submission, and ChatGPT developer mode on Plus and above, use this MCP endpoint. A
        pasted MCP URL is developer mode, not the free tier.
      </Paragraph>
      <Paragraph>PAMIAC_TOKEN has to be configured in the environment.</Paragraph>
      <Paragraph>Paste this endpoint.</Paragraph>
      <ConnectionMcpEndpoint />
    </div>
  );
}
