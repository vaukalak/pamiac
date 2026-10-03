import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectCursorInstall } from "@/components/connect/connect-cursor-install";
import { ConnectSelfServe } from "@/components/connect/connect-self-serve";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  onManual: () => void;
  platform: ConnectPlatform;
}

export function ConnectCursorSetup(props: Properties) {
  const { onAdvanced, onManual, platform } = props;

  return (
    <div className="token-connect-setup">
      <Paragraph className="token-connect-lead">{platform.lead}</Paragraph>
      <ConnectChecklist items={platform.checklist} />
      <ConnectCursorInstall onManual={onManual} />
      <ConnectSelfServe framed platform={platform} />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
