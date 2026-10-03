import { ConnectPlatformMark } from "@/components/connect/connect-platform-mark";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  badge?: string;
  mark?: ConnectPlatformId | "pamiac";
  title: string;
  titleId?: string;
}

export function ConnectHeadingTitle(props: Properties) {
  const { badge, mark, title, titleId } = props;

  return (
    <div className="token-connect-title">
      {mark ? <ConnectPlatformMark id={mark} /> : null}
      {titleId ? <h2 id={titleId}>{title}</h2> : <h1>{title}</h1>}
      {badge ? <span className="token-connect-badge">{badge}</span> : null}
    </div>
  );
}
