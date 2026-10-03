import { ConnectApiTokenFields } from "@/components/connect/connect-api-token-fields";
import type { ConnectPlatformId } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onGuides: () => void;
  platformId: ConnectPlatformId;
}

export function ConnectApiToken(props: Properties) {
  const { onGuides, platformId } = props;

  return (
    <div className="token-connect-token">
      <Paragraph>Use an API token when an agent cannot authenticate with Pamiac OAuth.</Paragraph>
      <Paragraph>
        The value shown after creation is an API key, not an OAuth access token.
      </Paragraph>
      <ConnectApiTokenFields onGuides={onGuides} platformId={platformId} />
    </div>
  );
}
