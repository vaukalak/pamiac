import { ConnectHeadingBar } from "@/components/connect/connect-heading-bar";
import { ConnectHeadingTitle } from "@/components/connect/connect-heading-title";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  badge?: string;
  onBack?: () => void;
  onClose?: () => void;
  subtitle?: string;
  title: string;
  titleId?: string;
}

export function ConnectHeading(props: Properties) {
  const { badge, onBack, onClose, subtitle, title, titleId } = props;

  return (
    <div className="token-connect-heading">
      <ConnectHeadingBar onBack={onBack} onClose={onClose} />
      <ConnectHeadingTitle badge={badge} title={title} titleId={titleId} />
      {subtitle ? <Paragraph>{subtitle}</Paragraph> : null}
    </div>
  );
}
