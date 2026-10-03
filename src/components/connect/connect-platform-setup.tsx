import { ConnectAdvancedEntry } from "@/components/connect/connect-advanced-entry";
import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectClaudeSetup } from "@/components/connect/connect-claude-setup";
import { ConnectPlatformAction } from "@/components/connect/connect-platform-action";
import { ConnectPlatformColumns } from "@/components/connect/connect-platform-columns";
import { ConnectSelfServe } from "@/components/connect/connect-self-serve";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onAdvanced: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformSetup(props: Properties) {
  const { onAdvanced, platform } = props;
  if (platform.id === "claude") {
    return <ConnectClaudeSetup onAdvanced={onAdvanced} platform={platform} />;
  }
  if (platform.layout === "columns") {
    return <ConnectPlatformColumns onAdvanced={onAdvanced} platform={platform} />;
  }

  return (
    <div className="token-connect-setup">
      {platform.lead ? <Paragraph className="token-connect-lead">{platform.lead}</Paragraph> : null}
      <ConnectChecklist items={platform.checklist} />
      <ConnectPlatformAction platform={platform} />
      <ConnectSelfServe framed platform={platform} />
      <ConnectAdvancedEntry onOpen={onAdvanced} />
    </div>
  );
}
