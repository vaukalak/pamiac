"use client";

import { useState } from "react";
import { LibraryCreateFolderDialogPortal } from "@/components/library/library-create-folder-dialog-portal";
import { Button } from "@/ui/Button";

interface Properties {
  disabled: boolean;
  onOpen: () => void;
}

export function LibraryCreateFolderItem(props: Properties) {
  const { disabled, onOpen } = props;
  const [open, setOpen] = useState(false);

  function show() {
    const current = document.activeElement;
    const details = current instanceof Element ? current.closest("details") : null;
    onOpen();
    if (details instanceof HTMLDetailsElement) {
      const summary = details.querySelector("summary");
      if (summary instanceof HTMLElement) summary.focus();
    }
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <>
      <Button className="menu-item" disabled={disabled} onClick={show} type="button">
        New folder
      </Button>
      {open ? <LibraryCreateFolderDialogPortal onClose={hide} /> : null}
    </>
  );
}
