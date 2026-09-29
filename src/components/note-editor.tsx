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
  const { initial, editable, onChange } = props;
  const editor = useCreateBlockNote({ setIdAttribute: true });
  const ready = useRef(false);
  const published = useRef<string | null>(null);
  const publishRef = useRef<() => void>(() => {});
  const dark = useSyncExternalStore(
    subscribeToColorScheme,
    colorSchemeSnapshot,
    colorSchemeServerSnapshot,
  );

  publishRef.current = () => {
    if (!ready.current || !editable) return;

    const markdown = markedMarkdownFromBlocks(editor.document, (block) =>
      editor.blocksToMarkdownLossy([block]),
    );
    if (published.current === null && markdown === initial) {
      published.current = markdown;
      return;
    }
    if (markdown === published.current) return;

    published.current = markdown;
    onChange(markdown);
  };

  useEffect(() => {
    return bindNoteMarkdownPublisher(editor, () => publishRef.current());
  }, [editor]);

  useEffect(() => {
    if (ready.current) return;

    const marked = parseBlockMarkdown(initial || "");
    const blocks = marked
      ? blocksFromMarkedMarkdown(marked, (markdown) => editor.tryParseMarkdownToBlocks(markdown))
      : editor.tryParseMarkdownToBlocks(initial || "");
    editor.replaceBlocks(editor.document, blocks);
    ready.current = true;

    const blockId = blockIdFromHash(window.location.hash, editor.document);
    if (blockId) scrollToBlock(blockId);
  }, [editor, initial]);

  function handleChange() {
    publishRef.current();
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
