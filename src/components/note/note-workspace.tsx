"use client";

import { createContext, useContext, type ReactNode } from "react";

const NoteWorkspaceContext = createContext<string | null>(null);

interface Properties {
  children: ReactNode;
  workspaceId: string | null;
}

export function NoteWorkspace(props: Properties) {
  const { children, workspaceId } = props;

  return (
    <NoteWorkspaceContext.Provider value={workspaceId}>{children}</NoteWorkspaceContext.Provider>
  );
}

export function useNoteWorkspace() {
  return useContext(NoteWorkspaceContext);
}
