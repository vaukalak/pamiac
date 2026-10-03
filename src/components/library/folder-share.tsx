"use client";

import { useState } from "react";
import { FolderShareModal } from "@/components/library/folder-share-modal";
import type { FolderRecord } from "@/lib/folder-library";
import { Button } from "@/ui/Button";

interface Properties {
  folder: FolderRecord;
}

export function FolderShare(props: Properties) {
  const { folder } = props;
  const [sharing, setSharing] = useState(false);

  return (
    <div className="doc-menu">
      <Button className="ghost small" onClick={() => setSharing(true)} type="button">
        Share
      </Button>
      {sharing ? <FolderShareModal folder={folder} onClose={() => setSharing(false)} /> : null}
    </div>
  );
}
