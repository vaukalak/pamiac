import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { PAMIAC_MCP_URL } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectionMcpEndpoint() {
  return (
    <div className="token-connect-endpoint">
      <Paragraph>MCP URL</Paragraph>
      <a className="dev-link" href={PAMIAC_MCP_URL}>
        {PAMIAC_MCP_URL}
      </a>
      <ConnectCopyAction label="Copy MCP URL" text={PAMIAC_MCP_URL} />
    </div>
  );
}
