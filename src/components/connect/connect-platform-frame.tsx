"use client";

import { useQuery } from "@tanstack/react-query";
import { ConnectHeading } from "@/components/connect/connect-heading";
import { ConnectPlatformConnected } from "@/components/connect/connect-platform-connected";
import { ConnectPlatformSetup } from "@/components/connect/connect-platform-setup";
import { connectConsentsQueryOptions } from "@/lib/connect-consents-query";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
  onBack: () => void;
  onClose?: () => void;
  platform: ConnectPlatform;
  titleId?: string;
}

export function ConnectPlatformFrame(props: Properties) {
  const { onAdvanced, onBack, onClose, platform, titleId } = props;
  const account = useQuery(connectConsentsQueryOptions());
  const connected =
    account.data?.connections.some((item) => item.platform === platform.id) ?? false;

  return (
    <div className="token-connect-platform">
      <ConnectHeading
        badge={platform.recommended && !connected ? "Recommended" : undefined}
        onBack={onBack}
        onClose={onClose}
        mark={platform.id}
        subtitle={connected ? undefined : platform.subtitle}
        title={platform.name}
        titleId={titleId}
      />
      {connected ? (
        <ConnectPlatformConnected onClose={onClose} platform={platform} />
      ) : (
        <ConnectPlatformSetup onAdvanced={onAdvanced} platform={platform} />
      )}
    </div>
  );
}
