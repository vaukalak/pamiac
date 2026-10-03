import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectMcpCopy } from "@/components/connect/connect-mcp-copy";
import { ConnectSetupPrompt } from "@/components/connect/connect-setup-prompt";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectDeepSeekSetup(props: Properties) {
  const { onAdvanced } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph className="token-connect-lead">
        Use Pamiac from a DeepSeek-powered agent or MCP-compatible DeepSeek client.
      </Paragraph>
      <ConnectSetupPrompt
        detail="Paste this prompt into your DeepSeek-powered agent."
        title="Let your agent configure itself"
      />
      <Section className="token-connect-self token-connect-self-framed">
        <h3>Manual MCP</h3>
        <ConnectMcpCopy className="secondary" />
      </Section>
      <Paragraph>Direct custom MCP support depends on the DeepSeek client you are using.</Paragraph>
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
