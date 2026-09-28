"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

interface Properties {
  initial: string;
  editable: boolean;
  onChange: (markdown: string) => void;
}

function subscribeToColorScheme(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function colorSchemeSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function colorSchemeServerSnapshot() {
  return false;
}

export function NoteEditor(props: Properties) {
  const { initial, editable, onChange } = props;
  const editor = useCreateBlockNote();
  const ready = useRef(false);
  const dark = useSyncExternalStore(subscribeToColorScheme, colorSchemeSnapshot, colorSchemeServerSnapshot);

  useEffect(() => {
    if (ready.current) return;
    const blocks = editor.tryParseMarkdownToBlocks(initial || "");
    editor.replaceBlocks(editor.document, blocks);
    ready.current = true;
  }, [editor, initial]);

  return (
    <div className="note-editor">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={dark ? "dark" : "light"}
        onChange={() => {
          if (!ready.current || !editable) return;
          onChange(editor.blocksToMarkdownLossy(editor.document));
        }}
      />
    </div>
  );
}
