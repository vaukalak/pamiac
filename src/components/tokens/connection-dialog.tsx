"use client";

import { ConnectionDialogPanel } from "@/components/tokens/connection-dialog-panel";

interface Properties {
  onClose: () => void;
}

export function ConnectionDialog(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <ConnectionDialogPanel onClose={onClose} />
    </div>
  );
}
