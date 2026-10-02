"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { LibraryFolderCrumb } from "@/components/library/library-folder-crumb";
import { useLibraryLocation } from "@/components/library/library-location";
import { folderTrail, libraryWorkspaceId } from "@/lib/folder-library";
import { libraryFoldersQueryOptions } from "@/lib/library-folders";
import { Button } from "@/ui/Button";

export function LibraryFolderTrail() {
  const { folderId, openFolder, workspaceId } = useLibraryLocation();
  const query = useQuery(libraryFoldersQueryOptions());
  const trail = folderTrail(query.data ?? [], folderId, libraryWorkspaceId(workspaceId));

  useEffect(() => {
    if (!folderId || !query.isSuccess) return;
    if (trail.length === 0) openFolder(null);
  }, [folderId, openFolder, query.isSuccess, trail.length]);

  if (!folderId || trail.length === 0) return null;

  return (
    <div className="library-folder-trail">
      <Button
        className="ghost small"
        onClick={() => {
          openFolder(null);
        }}
        type="button"
      >
        Library
      </Button>
      {trail.map((folder) => (
        <LibraryFolderCrumb
          current={folder.id === folderId}
          key={folder.id}
          name={folder.name}
          onOpen={() => {
            openFolder(folder.id);
          }}
        />
      ))}
    </div>
  );
}
