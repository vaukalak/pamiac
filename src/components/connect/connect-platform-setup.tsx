import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectPlatformAction } from "@/components/connect/connect-platform-action";
import { ConnectSelfServe } from "@/components/connect/connect-self-serve";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformSetup(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-setup">
      <ConnectChecklist items={platform.checklist} />
      {platform.linkPlacement === "before-action" ? <ConnectSelfServe platform={platform} /> : null}
      <ConnectPlatformAction label={platform.primaryLabel} />
      {platform.linkPlacement === "after-action" ? <ConnectSelfServe platform={platform} /> : null}
      <ConnectAdvancedEntry detail={platform.advancedHint} onOpen={onAdvanced} />
    </div>
  );
}
