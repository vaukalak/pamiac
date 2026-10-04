"use client";

import { useState } from "react";
import { NoteNotifyDialog } from "@/components/note-notify/note-notify-dialog";
import { Button } from "@/ui/Button";

interface Properties {
  documentId: string;
}

export function NoteNotifyButton(props: Properties) {
  const { documentId } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="secondary icon-button"
        expanded={open}
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 16 16"
          width="16"
        >
          <path d="M8 2.2a3.2 3.2 0 0 1 3.2 3.2c0 1.7.4 2.6 1 3.4.3.4.1 1-.5 1H4.3c-.6 0-.8-.6-.5-1 .6-.8 1-1.7 1-3.4A3.2 3.2 0 0 1 8 2.2Z" />
          <path d="M6.6 11.2a1.4 1.4 0 0 0 2.8 0" />
        </svg>
        <span className="visually-hidden">Notify</span>
      </Button>
      {open ? <NoteNotifyDialog documentId={documentId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
