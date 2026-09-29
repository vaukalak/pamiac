"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { NoteEditorSurface } from "@/components/note/note-editor-surface";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

interface Properties {
  markdown: string;
  version: number;
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
  const { markdown, version, editable, onChange } = props;
  const editor = useCreateBlockNote();
  const ready = useRef(false);
  const applying = useRef(false);
  const appliedVersion = useRef<number | null>(null);
  const baseline = useRef("");
  const dark = useSyncExternalStore(
    subscribeToColorScheme,
    colorSchemeSnapshot,
    colorSchemeServerSnapshot,
  );

  useEffect(() => {
    if (appliedVersion.current === version) return;
    applying.current = true;
    const blocks = editor.tryParseMarkdownToBlocks(markdown || "");
    editor.replaceBlocks(editor.document, blocks);
    baseline.current = editor.blocksToMarkdownLossy(editor.document);
    appliedVersion.current = version;
    ready.current = true;
    applying.current = false;
  }, [editor, markdown, version]);

  function handleChange() {
    if (applying.current || !ready.current || !editable) return;
    const next = editor.blocksToMarkdownLossy(editor.document);
    if (next === baseline.current) return;
    onChange(next);
  }

  return (
    <div className="note-editor">
      <NoteEditorSurface
        editable={editable}
        editor={editor}
        onChange={handleChange}
        theme={dark ? "dark" : "light"}
      />
    </div>
  );
}
