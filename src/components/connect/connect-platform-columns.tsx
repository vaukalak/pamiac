import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectPlatformAction } from "@/components/connect/connect-platform-action";
import { ConnectPlatformColumnBody } from "@/components/connect/connect-platform-column-body";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformColumns(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-setup">
      {platform.lead ? <Paragraph className="token-connect-lead">{platform.lead}</Paragraph> : null}
      <ConnectPlatformColumnBody platform={platform} />
      <ConnectPlatformAction platform={platform} />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
