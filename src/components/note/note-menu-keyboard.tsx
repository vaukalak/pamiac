"use client";

import { useBlockNoteEditor } from "@blocknote/react";
import { useEffect } from "react";
import {
  armResumeEditing,
  cancelResumeEditing,
  consumeResumeEditing,
  focusAfterMenuClose,
  hideSoftwareKeyboard,
  inputModeWhileMenu,
  noteMenuOpen,
  pointerResumesEditing,
} from "@/lib/note-menu-keyboard";
import { narrowNoteSnapshot, subscribeNarrowNote } from "@/lib/note-narrow";

export function NoteMenuKeyboard() {
  const editor = useBlockNoteEditor();

  useEffect(() => {
    const root = editor.prosemirrorView.dom;
    let wasOpen = false;

    const apply = () => {
      const narrow = narrowNoteSnapshot();
      const open = noteMenuOpen();
      const mode = inputModeWhileMenu(open, narrow);

      if (mode === "none") {
        root.setAttribute("inputmode", "none");
        hideSoftwareKeyboard();
        wasOpen = true;
        return;
      }

      if (!wasOpen) return;
      wasOpen = false;
      root.removeAttribute("inputmode");
      if (!narrow) return;

      const action = focusAfterMenuClose(consumeResumeEditing());
      if (action === "focus") editor.focus();
      else editor.blur();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!narrowNoteSnapshot()) return;
      if (pointerResumesEditing(event.target)) armResumeEditing();
      else if (
        event.target instanceof Element &&
        event.target.closest(".note-slash-backdrop, .note-block-menu-backdrop")
      ) {
        cancelResumeEditing();
      }
    };

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      attributeFilter: ["class", "style", "hidden"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    const narrowQuery = subscribeNarrowNote(apply);
    document.addEventListener("pointerdown", onPointerDown, true);
    apply();

    return () => {
      observer.disconnect();
      narrowQuery();
      document.removeEventListener("pointerdown", onPointerDown, true);
      root.removeAttribute("inputmode");
    };
  }, [editor]);

  return null;
}
