"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NoteCopyMarkdown } from "@/components/note/note-copy-markdown";
import { NoteExport } from "@/components/note/note-export";

interface Properties {
  readMarkdown: () => string;
  title: string;
}

export function NoteShareMarkdown(props: Properties) {
  const { readMarkdown, title } = props;
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.getElementById("note-share-markdown");
    setSlot(node instanceof HTMLElement ? node : null);
  }, []);

  if (!slot) return null;

  return createPortal(
    <div className="share-markdown-actions">
      <NoteCopyMarkdown readMarkdown={readMarkdown} />
      <NoteExport readMarkdown={readMarkdown} title={title} />
    </div>,
    slot,
  );
}
