"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export type LibraryDrag = {
  id: string;
  kind: "document" | "folder";
};

interface Location {
  drag: LibraryDrag | null;
  folderId: string | null;
  openFolder: (folderId: string | null) => void;
  setDrag: (drag: LibraryDrag | null) => void;
  workspaceId: string;
}

let libraryDrag: LibraryDrag | null = null;

export function readLibraryDrag() {
  return libraryDrag;
}

export function writeLibraryDrag(drag: LibraryDrag | null) {
  libraryDrag = drag;
}

const LibraryLocationContext = createContext<Location>({
  drag: null,
  folderId: null,
  openFolder: () => {},
  setDrag: () => {},
  workspaceId: PERSONAL_SPACE_ID,
});

interface Properties {
  children: ReactNode;
  drag: LibraryDrag | null;
  folderId: string | null;
  openFolder: (folderId: string | null) => void;
  setDrag: (drag: LibraryDrag | null) => void;
  workspaceId: string;
}

export function LibraryLocation(props: Properties) {
  const { children, drag, folderId, openFolder, setDrag, workspaceId } = props;

  return (
    <LibraryLocationContext.Provider value={{ drag, folderId, openFolder, setDrag, workspaceId }}>
      {children}
    </LibraryLocationContext.Provider>
  );
}

export function useLibraryLocation() {
  return useContext(LibraryLocationContext);
}
