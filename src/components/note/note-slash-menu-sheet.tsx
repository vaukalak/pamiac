"use client";

import { SuggestionMenu } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtension, useExtensionState } from "@blocknote/react";
import { useSyncExternalStore } from "react";

const NARROW_QUERY = "(max-width: 760px)";

function subscribeToNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readNarrow() {
  return window.matchMedia(NARROW_QUERY).matches;
}

function narrowOnServer() {
  return false;
}

export function NoteSlashMenuSheet() {
  const editor = useBlockNoteEditor();
  const suggestionMenu = useExtension(SuggestionMenu);
  const slashOpen = useExtensionState(SuggestionMenu, {
    selector: (state) => Boolean(state?.show && state.triggerCharacter === "/"),
  });
  const narrow = useSyncExternalStore(subscribeToNarrow, readNarrow, narrowOnServer);

  if (!slashOpen || !narrow) return null;

  return (
    <div
      aria-hidden="true"
      className="note-slash-backdrop"
      onPointerDown={(event) => {
        event.preventDefault();
        suggestionMenu.closeMenu();
        editor.focus();
      }}
    />
  );
}
