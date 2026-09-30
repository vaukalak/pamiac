import { Paragraph } from "@/ui/Paragraph";

const ENDPOINT = "/api/mcp";

export function ConnectionMcp() {
  return (
    <div className="token-connect-mcp">
      <Paragraph>
        Publisher submission, and ChatGPT developer mode on Plus and above, use this MCP endpoint. A
        pasted MCP URL is developer mode, not the free tier.
      </Paragraph>
      <p className="hint">{ENDPOINT}</p>
    </div>
  );
}
