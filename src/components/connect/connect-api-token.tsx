import { TokenCreateForm } from "@/components/tokens/token-create-form";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

const CONNECT_SCOPE_OPTIONS = [
  { value: "all" as const, label: "All my spaces" },
  { value: "selected" as const, label: "Selected workspaces" },
];

interface Properties {
  onGuides: () => void;
}

export function ConnectApiToken(props: Properties) {
  const { onGuides } = props;

  return (
    <div className="token-connect-token">
      <Paragraph>
        An API token is for an app that does not support OAuth. Grant the smallest access that still
        does the job.
      </Paragraph>
      <Paragraph>
        After you create a token, the new key is shown once. That value is an API key, not an OAuth
        access token.
      </Paragraph>
      <TokenCreateForm
        expirationLabel="Expires"
        idPrefix="connect-token"
        scopeLabel="Access"
        scopeOptions={CONNECT_SCOPE_OPTIONS}
        submitLabel="Create token"
      />
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
