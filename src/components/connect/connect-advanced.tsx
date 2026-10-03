"use client";

import { useState } from "react";
import { ConnectHeading } from "@/components/connect/connect-heading";
import { ConnectionPanel } from "@/components/tokens/connection-panel";
import { ConnectionTabs, type ConnectionTabId } from "@/components/tokens/connection-tabs";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  onBack: () => void;
  onClose?: () => void;
  onGuides: () => void;
  platformId: ConnectPlatformId;
  titleId?: string;
}

export function ConnectAdvanced(props: Properties) {
  const { onBack, onClose, onGuides, platformId, titleId } = props;
  const [tab, setTab] = useState<ConnectionTabId>("token");

  return (
    <div className="token-connect-advanced">
      <ConnectHeading
        onBack={onBack}
        onClose={onClose}
        title="Advanced options"
        titleId={titleId}
      />
      <ConnectionTabs onTab={setTab} tab={tab} />
      <ConnectionPanel onGuides={onGuides} platformId={platformId} tab={tab} />
    </div>
  );
}
