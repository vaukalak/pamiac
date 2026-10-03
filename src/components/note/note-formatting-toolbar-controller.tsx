"use client";

import {
  DesktopFormattingToolbarController,
  FormattingToolbarController,
  useEditorFocus,
  useVirtualKeyboard,
} from "@blocknote/react";
import { useSyncExternalStore } from "react";
import { NoteFormattingToolbar } from "@/components/note/note-formatting-toolbar";
import { NoteMobileFormattingToolbar } from "@/components/note/note-mobile-formatting-toolbar";
import { formattingToolbarMenuOpen } from "@/lib/note-menu-keyboard";
import {
  narrowNoteServerSnapshot,
  narrowNoteSnapshot,
  subscribeNarrowNote,
} from "@/lib/note-narrow";

function subscribeFormattingToolbarMenu(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, {
    attributeFilter: ["class", "style", "hidden"],
    attributes: true,
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}

function formattingToolbarMenuSnapshot() {
  return formattingToolbarMenuOpen();
}

function formattingToolbarMenuServerSnapshot() {
  return false;
}

export function NoteFormattingToolbarController() {
  const narrow = useSyncExternalStore(
    subscribeNarrowNote,
    narrowNoteSnapshot,
    narrowNoteServerSnapshot,
  );
  const keyboardOpen = useVirtualKeyboard();
  const focused = useEditorFocus({ includeEditorUI: true });
  const toolbarMenuOpen = useSyncExternalStore(
    subscribeFormattingToolbarMenu,
    formattingToolbarMenuSnapshot,
    formattingToolbarMenuServerSnapshot,
  );

  if (!narrow) {
    return <FormattingToolbarController formattingToolbar={NoteFormattingToolbar} />;
  }

  if ((keyboardOpen && focused) || toolbarMenuOpen) {
    return <NoteMobileFormattingToolbar />;
  }

  return <DesktopFormattingToolbarController formattingToolbar={NoteFormattingToolbar} />;
}
