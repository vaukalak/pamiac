"use client";

import { useEffect, useRef, useState } from "react";
import { LibraryCreateFolderForm } from "@/components/library/library-create-folder-form";
import { useLibraryLocation } from "@/components/library/library-location";
import { Button } from "@/ui/Button";

interface Properties {
  disabled: boolean;
  onCreated: () => void;
}

export function LibraryCreateFolderItem(props: Properties) {
  const { disabled, onCreated } = props;
  const { folderId, workspaceId } = useLibraryLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [naming, setNaming] = useState(false);

  useEffect(() => {
    const details = rootRef.current?.closest("details");
    if (!(details instanceof HTMLDetailsElement)) return;
    const menu: HTMLDetailsElement = details;

    function onToggle() {
      if (!menu.open) setNaming(false);
    }

    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
  }, []);

  return (
    <div ref={rootRef}>
      <Button
        className="menu-item"
        disabled={disabled}
        expanded={naming}
        onClick={() => setNaming(true)}
        type="button"
      >
        New folder
      </Button>
      {naming ? (
        <LibraryCreateFolderForm
          onCreated={onCreated}
          parentId={folderId}
          workspaceId={workspaceId}
        />
      ) : null}
    </div>
  );
}
