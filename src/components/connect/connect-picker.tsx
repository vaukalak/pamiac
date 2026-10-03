import { ConnectAgentSetup } from "@/components/connect/connect-agent-setup";
import { ConnectHeading } from "@/components/connect/connect-heading";
import { ConnectPlatformGrid } from "@/components/connect/connect-platform-grid";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  onClose?: () => void;
  onPlatform: (platformId: ConnectPlatformId) => void;
  showHeading?: boolean;
  titleId?: string;
}

export function ConnectPicker(props: Properties) {
  const { onClose, onPlatform, showHeading = true, titleId } = props;

  return (
    <div className="token-connect-picker">
      {showHeading ? (
        <ConnectHeading
          onClose={onClose}
          subtitle="Use your Pamiac notes and diagrams from your favorite AI."
          mark="pamiac"
          title="Connect Pamiac"
          titleId={titleId}
        />
      ) : null}
      <ConnectPlatformGrid onPlatform={onPlatform} />
      <ConnectAgentSetup />
    </div>
  );
}
