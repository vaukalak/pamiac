"use client";

import { useRef, useState } from "react";
import { NoteNotifyBell } from "@/components/note-notify/note-notify-bell";
import { NoteNotifyDialog } from "@/components/note-notify/note-notify-dialog";

interface Properties {
  documentId: string;
}

export function NoteNotifyButton(props: Properties) {
  const { documentId } = props;
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="note-notify-anchor" ref={anchorRef}>
      <NoteNotifyBell
        documentId={documentId}
        open={open}
        onToggle={() => setOpen((value) => !value)}
      />
      {open ? (
        <NoteNotifyDialog
          anchorRef={anchorRef}
          documentId={documentId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
