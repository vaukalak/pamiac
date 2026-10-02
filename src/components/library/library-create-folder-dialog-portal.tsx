"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LibraryCreateFolderDialog } from "@/components/library/library-create-folder-dialog";

interface Properties {
  onClose: () => void;
}

export function LibraryCreateFolderDialogPortal(props: Properties) {
  const { onClose } = props;
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const shell = document.querySelector(".library-shell");
    setMount(shell instanceof HTMLElement ? shell : document.body);
  }, []);

  if (!mount) return null;

  return createPortal(<LibraryCreateFolderDialog onClose={onClose} />, mount);
}
