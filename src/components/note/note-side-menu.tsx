"use client";

import { SideMenu, type SideMenuProps } from "@blocknote/react";
import { useSyncExternalStore } from "react";
import { NoteDragHandleMenu } from "@/components/note/note-drag-handle-menu";
import {
  narrowNoteServerSnapshot,
  narrowNoteSnapshot,
  subscribeNarrowNote,
} from "@/lib/note-narrow";

interface Properties {
  dragHandleMenu?: SideMenuProps["dragHandleMenu"];
}

export function NoteSideMenu(props: Properties) {
  const { dragHandleMenu = NoteDragHandleMenu } = props;
  const narrow = useSyncExternalStore(
    subscribeNarrowNote,
    narrowNoteSnapshot,
    narrowNoteServerSnapshot,
  );

  if (narrow) {
    return (
      <SideMenu dragHandleMenu={dragHandleMenu}>
        <span hidden />
      </SideMenu>
    );
  }

  return <SideMenu dragHandleMenu={dragHandleMenu} />;
}
