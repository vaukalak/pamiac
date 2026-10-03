"use client";

import { useState } from "react";
import { ConnectHeading } from "@/components/connect/connect-heading";
import { ConnectionPanel } from "@/components/tokens/connection-panel";
import { ConnectionTabs, type ConnectionTabId } from "@/components/tokens/connection-tabs";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  initialTab?: ConnectionTabId;
  onBack: () => void;
  onClose?: () => void;
  onGuides: () => void;
  platformId: ConnectPlatformId;
  titleId?: string;
}

export function ConnectAdvanced(props: Properties) {
  const { initialTab = "token", onBack, onClose, onGuides, platformId, titleId } = props;
  const [tab, setTab] = useState<ConnectionTabId>(initialTab);

  return (
    <div className="token-connect-advanced">
      <ConnectHeading
        onBack={onBack}
        onClose={onClose}
        title="Advanced options"
        titleId={titleId}
      />
      <ConnectionTabs onTab={setTab} tab={tab} />
      <ConnectionPanel
        onGuides={onGuides}
        onToken={() => setTab("token")}
        platformId={platformId}
        tab={tab}
      />
    </div>
  );
}
