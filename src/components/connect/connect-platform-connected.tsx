"use client";

import { useQuery } from "@tanstack/react-query";
import { ConnectAccessSummary } from "@/components/connect/connect-access-summary";
import { ConnectAccountRow } from "@/components/connect/connect-account-row";
import { ConnectConnectedBanner } from "@/components/connect/connect-connected-banner";
import { ConnectConnectedDone } from "@/components/connect/connect-connected-done";
import { ConnectNextSteps } from "@/components/connect/connect-next-steps";
import { connectConsentsQueryOptions } from "@/lib/connect-consents-query";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onClose?: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformConnected(props: Properties) {
  const { onClose, platform } = props;
  const account = useQuery(connectConsentsQueryOptions());
  const match = account.data?.connections.find((item) => item.platform === platform.id);
  if (!account.data || !match) return null;

  return (
    <div className="token-connect-connected">
      <ConnectConnectedBanner />
      <ConnectAccountRow
        connectedAt={match.connectedAt}
        email={account.data.email}
        name={account.data.name}
      />
      <ConnectAccessSummary />
      <ConnectNextSteps platformName={platform.name} />
      {onClose ? <ConnectConnectedDone onClose={onClose} /> : null}
    </div>
  );
}
