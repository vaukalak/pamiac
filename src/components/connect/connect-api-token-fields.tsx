import { ConnectApiTokenGuide } from "@/components/connect/connect-api-token-guide";
import { TokenCreateForm } from "@/components/tokens/token-create-form";
import { connectTokenName, type ConnectPlatformId } from "@/lib/connect-platforms";

const CONNECT_SCOPE_OPTIONS = [
  { value: "all" as const, label: "All my spaces" },
  { value: "selected" as const, label: "Selected workspaces" },
];

interface Properties {
  onGuides: () => void;
  platformId: ConnectPlatformId;
}

export function ConnectApiTokenFields(props: Properties) {
  const { onGuides, platformId } = props;

  return (
    <div className="token-connect-token-grid">
      <TokenCreateForm
        defaultExpiration="90d"
        defaultName={connectTokenName(platformId)}
        expirationLabel="Expires"
        idPrefix="connect-token"
        scopeLabel="Access"
        scopeOptions={CONNECT_SCOPE_OPTIONS}
        submitLabel="Create token"
      />
      <ConnectApiTokenGuide onGuides={onGuides} />
    </div>
  );
}
