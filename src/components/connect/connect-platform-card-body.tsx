import { ConnectPlatformMark } from "@/components/connect/connect-platform-mark";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  platform: ConnectPlatform;
}

export function ConnectPlatformCardBody(props: Properties) {
  const { platform } = props;

  return (
    <span className="token-connect-card-row">
      <ConnectPlatformMark id={platform.id} />
      <span className="token-connect-card-copy">
        <span className="token-connect-card-name">{platform.name}</span>
        <span className="token-connect-card-blurb">{platform.blurb}</span>
      </span>
    </span>
  );
}
