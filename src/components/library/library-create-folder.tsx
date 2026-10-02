"use client";

import { useEffect, useRef } from "react";
import { LibraryCreateFolderForm } from "@/components/library/library-create-folder-form";
import { useLibraryLocation } from "@/components/library/library-location";

export function LibraryCreateFolder() {
  const { folderId, workspaceId } = useLibraryLocation();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (details.contains(event.target as Node)) return;
      details.open = false;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const details = detailsRef.current;
      if (!details?.open) return;
      event.preventDefault();
      details.open = false;
      const summary = details.querySelector("summary");
      if (summary instanceof HTMLElement) summary.focus();
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function close() {
    const details = detailsRef.current;
    if (!details) return;
    details.open = false;
  }

  return (
    <details className="library-create" ref={detailsRef}>
      <summary aria-label="New folder" className="library-plus library-folder-plus">
        New folder
      </summary>
      <LibraryCreateFolderForm onCreated={close} parentId={folderId} workspaceId={workspaceId} />
    </details>
  );
}
