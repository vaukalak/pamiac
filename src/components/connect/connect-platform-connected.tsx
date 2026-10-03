"use client";

import { useQuery } from "@tanstack/react-query";
import { ConnectAccessSummary } from "@/components/connect/connect-access-summary";
import { ConnectAccountRow } from "@/components/connect/connect-account-row";
import { ConnectConnectedBanner } from "@/components/connect/connect-connected-banner";
import { ConnectNextSteps } from "@/components/connect/connect-next-steps";
import { connectConsentsQueryOptions } from "@/lib/connect-consents-query";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  platform: ConnectPlatform;
}

export function ConnectPlatformConnected(props: Properties) {
  const { platform } = props;
  const account = useQuery(connectConsentsQueryOptions());
  const match = account.data?.connections.find((item) => item.platform === platform.id);
  if (!account.data || !match) return null;

  return (
    <div className="token-connect-connected">
      <ConnectConnectedBanner platformName={platform.name} />
      <ConnectAccountRow
        connectedAt={match.connectedAt}
        email={account.data.email}
        name={account.data.name}
      />
      <ConnectAccessSummary />
      <ConnectNextSteps platformName={platform.name} />
    </div>
  );
}
