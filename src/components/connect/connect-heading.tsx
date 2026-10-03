import { ConnectHeadingBar } from "@/components/connect/connect-heading-bar";
import { ConnectHeadingTitle } from "@/components/connect/connect-heading-title";
import type { ConnectPlatformId } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  badge?: string;
  mark?: ConnectPlatformId | "pamiac";
  onBack?: () => void;
  onClose?: () => void;
  subtitle?: string;
  title: string;
  titleId?: string;
}

export function ConnectHeading(props: Properties) {
  const { badge, mark, onBack, onClose, subtitle, title, titleId } = props;

  return (
    <div className="token-connect-heading">
      <ConnectHeadingBar onBack={onBack} onClose={onClose} />
      <ConnectHeadingTitle badge={badge} mark={mark} title={title} titleId={titleId} />
      {subtitle ? <Paragraph>{subtitle}</Paragraph> : null}
    </div>
  );
}
