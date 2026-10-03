import { ConnectPlatformCardBody } from "@/components/connect/connect-platform-card-body";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Button } from "@/ui/Button";

interface Properties {
  platform: ConnectPlatform;
  onSelect: () => void;
}

export function ConnectPlatformCard(props: Properties) {
  const { platform, onSelect } = props;
  const tone = platform.recommended
    ? "secondary token-connect-card token-connect-card-primary"
    : "secondary token-connect-card";

  return (
    <Button
      className={`${tone} token-connect-card-${platform.id}`}
      onClick={onSelect}
      type="button"
    >
      <ConnectPlatformCardBody platform={platform} />
    </Button>
  );
}
