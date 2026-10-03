import { ConnectChecklist } from "@/components/connect/connect-checklist";
import { ConnectSelfServe } from "@/components/connect/connect-self-serve";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  platform: ConnectPlatform;
}

export function ConnectPlatformColumnBody(props: Properties) {
  const { platform } = props;

  return (
    <div className="token-connect-columns">
      <ConnectChecklist items={platform.checklist} />
      <ConnectSelfServe framed platform={platform} />
    </div>
  );
}
