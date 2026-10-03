"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DocumentSharePortal } from "@/components/library/document-share-portal";
import { ShareModal } from "@/components/share/share-modal";
import type { FolderRecord } from "@/lib/folder-library";
import { libraryFoldersQueryKey } from "@/lib/library-folders";

interface Properties {
  folder: FolderRecord;
  onClose: () => void;
}

export function FolderShareModal(props: Properties) {
  const { folder, onClose } = props;
  const queryClient = useQueryClient();

  return (
    <DocumentSharePortal>
      <ShareModal
        emails={folder.emails}
        hasPassword={folder.hasPassword}
        id={folder.id}
        lockWorkspace
        onClose={onClose}
        onSaved={(share) => {
          queryClient.setQueryData<FolderRecord[]>(libraryFoldersQueryKey, (current) =>
            current?.map((item) =>
              item.id === folder.id
                ? {
                    ...item,
                    visibility: share.visibility,
                    emails: share.emails,
                    hasPassword: share.hasPassword,
                  }
                : item,
            ),
          );
          void queryClient.invalidateQueries({ queryKey: libraryFoldersQueryKey });
        }}
        target="folder"
        visibility={folder.visibility}
        workspaceId={folder.workspaceId}
      />
    </DocumentSharePortal>
  );
}
