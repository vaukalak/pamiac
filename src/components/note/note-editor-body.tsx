"use client";

import type { ReactNode } from "react";
import { NoteComments, type NoteCommentValue } from "@/components/note/note-comments";

interface Properties {
  children: ReactNode;
  value: NoteCommentValue;
}

export function NoteEditorBody(props: Properties) {
  const { children, value } = props;

  return (
    <NoteComments value={value}>
      <div className="note-editor">{children}</div>
    </NoteComments>
  );
}
