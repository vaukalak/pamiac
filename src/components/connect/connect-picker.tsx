import { ConnectAgentLink } from "@/components/connect/connect-agent-link";
import { ConnectHeading } from "@/components/connect/connect-heading";
import { ConnectPlatformGrid } from "@/components/connect/connect-platform-grid";
import type { ConnectPlatformId } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

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
          title="Connect Pamiac"
          titleId={titleId}
        />
      ) : null}
      <ConnectPlatformGrid onPlatform={onPlatform} />
      <Paragraph className="token-connect-or">OR LET YOUR AGENT DO IT</Paragraph>
      <ConnectAgentLink
        hint="The agent will choose the best setup method."
        label="Give your AI this link"
      />
    </div>
  );
}
