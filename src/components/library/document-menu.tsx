"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { BoardChange, BoardDocument } from "@/components/library/board-document";
import { DocumentMenuPanel } from "@/components/library/document-menu-panel";
import { ShareModal } from "@/components/share/share-modal";

interface Properties {
  document: BoardDocument;
  onChange: (change: BoardChange) => void;
}

type MenuMode = "actions" | "rename" | "delete";

export function DocumentMenu(props: Properties) {
  const item = props.document;
  const { onChange } = props;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<MenuMode>("actions");
  const [sharing, setSharing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open || sharing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setMode("actions");
      buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setMode("actions");
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, sharing]);

  function close() {
    setOpen(false);
    setMode("actions");
  }

  return (
    <div className="doc-menu" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for ${item.title}`}
        className="icon-button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
          setMode("actions");
        }}
        ref={buttonRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
          viewBox="0 0 16 16"
          width="16"
        >
          <circle cx="8" cy="3.5" r="1" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="8" cy="12.5" r="1" />
        </svg>
      </button>
      {open ? (
        <DocumentMenuPanel
          id={menuId}
          item={item}
          mode={mode}
          onChange={onChange}
          onClose={close}
          onMode={setMode}
          onShare={() => setSharing(true)}
        />
      ) : null}
      {sharing ? (
        <ShareModal
          emails={item.emails}
          hasPassword={item.hasPassword}
          id={item.id}
          onClose={() => setSharing(false)}
          onSaved={(share) =>
            onChange({
              kind: "share",
              id: item.id,
              visibility: share.visibility,
              emails: share.emails,
              hasPassword: share.hasPassword,
            })
          }
          visibility={item.visibility}
        />
      ) : null}
    </div>
  );
}
