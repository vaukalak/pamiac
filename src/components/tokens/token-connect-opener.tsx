"use client";

import { useState } from "react";
import { ConnectPicker } from "@/components/connect/connect-picker";
import { ConnectionDialog } from "@/components/tokens/connection-dialog";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

export function TokenConnectOpener() {
  const [platformId, setPlatformId] = useState<ConnectPlatformId | null>(null);

  return (
    <div className="token-connect">
      <ConnectPicker onPlatform={setPlatformId} />
      {platformId ? (
        <ConnectionDialog initialPlatformId={platformId} onClose={() => setPlatformId(null)} />
      ) : null}
    </div>
  );
}
