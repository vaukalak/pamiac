"use client";

import type { ReactNode } from "react";
import { LibraryCreateFolderForm } from "@/components/library/library-create-folder-form";
import { LibraryCreateFolderPanel } from "@/components/library/library-create-folder-panel";
import { useLibraryLocation } from "@/components/library/library-location";

interface Properties {
  onClose: () => void;
}

export function LibraryCreateFolderDialog(props: Properties) {
  const { onClose } = props;
  const { folderId, workspaceId } = useLibraryLocation();
  const form: ReactNode = (
    <LibraryCreateFolderForm onCreated={onClose} parentId={folderId} workspaceId={workspaceId} />
  );

  return (
    <div className="share-backdrop" onPointerDown={onClose} role="presentation">
      <LibraryCreateFolderPanel form={form} onClose={onClose} />
    </div>
  );
}
