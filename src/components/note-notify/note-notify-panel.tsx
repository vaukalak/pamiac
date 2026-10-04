"use client";

import type { RefObject } from "react";
import { NoteNotifyBody } from "@/components/note-notify/note-notify-body";
import { NoteNotifyHeading } from "@/components/note-notify/note-notify-heading";

interface Properties {
  dialogRef: RefObject<HTMLDivElement | null>;
  documentId: string;
  onClose: () => void;
}

export function NoteNotifyPanel(props: Properties) {
  const { dialogRef, documentId, onClose } = props;

  return (
    <div
      aria-labelledby="note-notify-title"
      aria-modal="true"
      className="share-dialog share-access-dialog"
      onClick={(event) => event.stopPropagation()}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <NoteNotifyHeading onClose={onClose} />
      <NoteNotifyBody documentId={documentId} />
    </div>
  );
}
