"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TokenFormDialogPanel } from "@/components/tokens/token-form-dialog-panel";

interface Properties {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function TokenFormDialog(props: Properties) {
  const { children, onClose, title } = props;
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const shell = document.querySelector(".library-shell");
    setMount(shell instanceof HTMLElement ? shell : document.body);
  }, []);

  if (!mount) return null;

  return createPortal(
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <TokenFormDialogPanel onClose={onClose} title={title}>
        {children}
      </TokenFormDialogPanel>
    </div>,
    mount,
  );
}
