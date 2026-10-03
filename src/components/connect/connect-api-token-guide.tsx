import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onGuides: () => void;
}

export function ConnectApiTokenGuide(props: Properties) {
  const { onGuides } = props;

  return (
    <div className="token-connect-guide">
      <Paragraph>How to use</Paragraph>
      <Paragraph>Set the environment variable PAMIAC_TOKEN.</Paragraph>
      <Paragraph>
        A placeholder looks like PAMIAC_TOKEN=pam_example. That placeholder is not a real key.
      </Paragraph>
      <Paragraph>
        The same value can be sent as an Authorization bearer header. Cursor MCP config and the
        agent HTTP API already send that header.
      </Paragraph>
      <Paragraph>Examples: Cursor, Claude Code, and custom agents.</Paragraph>
      <Button className="secondary" onClick={onGuides} type="button">
        View platform-specific guides
      </Button>
    </div>
  );
}
