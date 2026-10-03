import { ConnectApiTokenGuide } from "@/components/connect/connect-api-token-guide";
import { TokenCreateForm } from "@/components/tokens/token-create-form";
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
      <div className="token-connect-token-grid">
        <TokenCreateForm
          expirationLabel="Expires"
          idPrefix="connect-token"
          scopeLabel="Access"
          scopeOptions={CONNECT_SCOPE_OPTIONS}
          submitLabel="Create token"
        />
        <ConnectApiTokenGuide onGuides={onGuides} />
      </div>
    </div>
  );
}
