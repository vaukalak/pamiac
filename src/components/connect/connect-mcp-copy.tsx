import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { PAMIAC_MCP_URL } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  className?: string;
}

export function ConnectMcpCopy(props: Properties) {
  const { className = "library-lime" } = props;

  return (
    <div className="token-connect-claude-mcp">
      <Paragraph>MCP URL</Paragraph>
      <ConnectPromptText text={PAMIAC_MCP_URL} />
      <ConnectCopyAction className={className} label="Copy MCP URL" text={PAMIAC_MCP_URL} />
    </div>
  );
}
