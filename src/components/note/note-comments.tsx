"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { NoteCommentMap } from "@/lib/note-blocks";

export interface NoteCommentValue {
  cancel: () => void;
  comments: NoteCommentMap;
  edit: (blockId: string) => void;
  editable: boolean;
  editingId: string | null;
  remove: (blockId: string) => void;
  save: (blockId: string, text: string) => void;
}

const NoteCommentContext = createContext<NoteCommentValue | null>(null);

interface Properties {
  children: ReactNode;
  value: NoteCommentValue;
}

export function NoteComments(props: Properties) {
  const { children, value } = props;

  return <NoteCommentContext.Provider value={value}>{children}</NoteCommentContext.Provider>;
}

export function useNoteComments() {
  const value = useContext(NoteCommentContext);
  if (!value) throw new Error("Note comments are unavailable");
  return value;
}
