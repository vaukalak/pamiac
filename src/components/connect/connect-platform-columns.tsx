import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectPlatformAction } from "@/components/connect/connect-platform-action";
import { ConnectSelfServe } from "@/components/connect/connect-self-serve";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformColumns(props: Properties) {
  const { onAdvanced, platform } = props;

  return (
    <div className="token-connect-setup">
      <div className="token-connect-columns">
        <ConnectChecklist items={platform.checklist} />
        <ConnectSelfServe framed platform={platform} />
      </div>
      <ConnectPlatformAction label={platform.primaryLabel} />
      <ConnectAdvancedEntry detail={platform.advancedHint} onOpen={onAdvanced} />
    </div>
  );
}
