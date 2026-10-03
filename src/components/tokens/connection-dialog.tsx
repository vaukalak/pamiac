"use client";

import { ConnectionDialogPanel } from "@/components/tokens/connection-dialog-panel";
import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  initialPlatformId?: ConnectPlatformId;
  onClose: () => void;
}

export function ConnectionDialog(props: Properties) {
  const { initialPlatformId, onClose } = props;

  return (
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <ConnectionDialogPanel initialPlatformId={initialPlatformId} onClose={onClose} />
    </div>
  );
}
