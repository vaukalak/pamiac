import { ConnectPlatformCard } from "@/components/connect/connect-platform-card";
import { CONNECT_PLATFORMS, type ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  onPlatform: (platformId: ConnectPlatformId) => void;
}

export function ConnectPlatformGrid(props: Properties) {
  const { onPlatform } = props;

  return (
    <div aria-label="Choose your AI" className="token-connect-grid" role="group">
      {CONNECT_PLATFORMS.map((platform) => (
        <ConnectPlatformCard
          key={platform.id}
          onSelect={() => onPlatform(platform.id)}
          platform={platform}
        />
      ))}
    </div>
  );
}
