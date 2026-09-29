"use client";

import dynamic from "next/dynamic";
import { NoteTitle } from "@/components/document/note-title";

const NoteEditor = dynamic(() => import("@/components/note-editor").then((mod) => mod.NoteEditor), {
  ssr: false,
});

interface Properties {
  title: string;
  content: string;
  canEdit: boolean;
  onContent: (markdown: string) => void;
  onTitle: (title: string) => void;
  onTitleBlur: () => void;
}

export function NoteDocument(props: Properties) {
  const { title, content, canEdit, onContent, onTitle, onTitleBlur } = props;

  return (
    <div className="note-sheet">
      <NoteTitle disabled={!canEdit} value={title} onBlur={onTitleBlur} onChange={onTitle} />
      <NoteEditor editable={canEdit} initial={content} onChange={onContent} />
    </div>
  );
}
