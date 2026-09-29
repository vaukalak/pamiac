"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { NoteEditorSurface } from "@/components/note/note-editor-surface";
import { bindNoteMarkdownPublisher } from "@/components/note/note-markdown-publisher";
import {
  blockIdFromHash,
  blocksFromMarkedMarkdown,
  markedMarkdownFromBlocks,
  parseBlockMarkdown,
} from "@/lib/block-link";
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

function scrollToBlock(id: string) {
  let frames = 0;

  const step = () => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ block: "center" });
      return;
    }

    frames += 1;
    if (frames < 10) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

export function NoteEditor(props: Properties) {
  const { markdown, version, editable, onChange } = props;
  const editor = useCreateBlockNote({ setIdAttribute: true });
  const ready = useRef(false);
  const applying = useRef(false);
  const appliedVersion = useRef<number | null>(null);
  const baseline = useRef("");
  const stored = useRef(markdown);
  const publishRef = useRef<() => void>(() => {});
  const dark = useSyncExternalStore(
    subscribeToColorScheme,
    colorSchemeSnapshot,
    colorSchemeServerSnapshot,
  );

  function noteMarkdown() {
    return markedMarkdownFromBlocks(editor.document, (block) =>
      editor.blocksToMarkdownLossy([block]),
    );
  }

  function emit(next: string) {
    if (next === stored.current) return;
    stored.current = next;
    baseline.current = next;
    onChange(next);
  }

  publishRef.current = () => {
    if (!ready.current || !editable) return;
    if (applying.current) return;
    emit(noteMarkdown());
  };

  useEffect(() => {
    return bindNoteMarkdownPublisher(editor, () => publishRef.current());
  }, [editor]);

  useEffect(() => {
    if (appliedVersion.current === version) return;

    const first = appliedVersion.current === null;
    applying.current = true;
    const marked = parseBlockMarkdown(markdown || "");
    const blocks = marked
      ? blocksFromMarkedMarkdown(marked, (part) => editor.tryParseMarkdownToBlocks(part))
      : editor.tryParseMarkdownToBlocks(markdown || "");
    editor.replaceBlocks(editor.document, blocks);
    baseline.current = noteMarkdown();
    stored.current = markdown;
    appliedVersion.current = version;
    ready.current = true;
    applying.current = false;

    if (!first) return;
    const blockId = blockIdFromHash(window.location.hash, editor.document);
    if (blockId) scrollToBlock(blockId);
  }, [editor, markdown, version]);

  function handleChange() {
    if (applying.current) return;
    if (!ready.current || !editable) return;
    const next = noteMarkdown();
    if (next === baseline.current) return;
    emit(next);
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
