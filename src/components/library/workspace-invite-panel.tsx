"use client";

import { useEffect, useRef } from "react";
import { WorkspaceInviteBody } from "@/components/library/workspace-invite-body";
import { WorkspaceInviteHeading } from "@/components/library/workspace-invite-heading";

interface Properties {
  inviteId: string;
  onClose: () => void;
}

export function WorkspaceInvitePanel(props: Properties) {
  const { inviteId, onClose } = props;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  return (
    <div
      aria-labelledby="workspace-invite-title"
      aria-modal="true"
      className="share-dialog workspace-invite-dialog"
      onClick={(event) => event.stopPropagation()}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <WorkspaceInviteHeading onClose={onClose} />
      <WorkspaceInviteBody inviteId={inviteId} onClose={onClose} />
    </div>
  );
}
