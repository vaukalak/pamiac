import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  platform: ConnectPlatform;
}

export function ConnectPlatformCardBody(props: Properties) {
  const { platform } = props;

  return (
    <span className="token-connect-card-copy">
      <span aria-hidden="true" className="token-connect-mark">
        {platform.mark}
      </span>
      <span className="token-connect-card-name">{platform.name}</span>
      <span className="token-connect-card-blurb">{platform.blurb}</span>
    </span>
  );
}
