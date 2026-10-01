"use client";

import type { ReactNode } from "react";
import type { NoteCommentValue } from "@/components/note/note-comments";
import { NoteEditorBody } from "@/components/note/note-editor-body";
import { NoteWorkspace } from "@/components/note/note-workspace";

interface Properties {
  children: ReactNode;
  value: NoteCommentValue;
  workspaceId: string | null;
}

export function NoteEditorFrame(props: Properties) {
  const { children, value, workspaceId } = props;

  return (
    <NoteWorkspace workspaceId={workspaceId}>
      <NoteEditorBody value={value}>{children}</NoteEditorBody>
    </NoteWorkspace>
  );
}
