"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bindNoteSelectAll } from "@/components/note/note-select-all";
import { NoteEditorFrame } from "@/components/note/note-editor-frame";
import { NoteEditorSurface } from "@/components/note/note-editor-surface";
import { NoteLasso } from "@/components/note/note-lasso";
import { bindNoteMarkdownPublisher } from "@/components/note/note-markdown-publisher";
import { noteSchema } from "@/components/note/note-schema";
import {
  blockIdFromHash,
  blocksFromMarkedMarkdown,
  markedMarkdownFromBlocks,
  parseBlockMarkdown,
} from "@/lib/block-link";
import {
  packNoteContent,
  readNoteComments,
  readNoteContent,
  withNoteComments,
  type NoteCommentMap,
} from "@/lib/note-blocks";
import { flattenWikiBlock, linkifyWikiBlocks } from "@/lib/note-link";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

interface Properties {
  markdown: string;
  version: number;
  editable: boolean;
  onChange: (markdown: string) => void;
  libraryShell?: boolean;
  workspaceId: string | null;
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

function commentIds(blocks: readonly { id: string; children?: readonly { id: string }[] }[]) {
  const ids = new Set<string>();
  for (const block of blocks) {
    ids.add(block.id);
    if (block.children) {
      for (const id of commentIds(block.children)) ids.add(id);
    }
  }
  return ids;
}

export function NoteEditor(props: Properties) {
  const { markdown, version, editable, onChange, libraryShell = false, workspaceId } = props;
  const editor = useCreateBlockNote({ schema: noteSchema, setIdAttribute: true });
  const ready = useRef(false);
  const applying = useRef(false);
  const appliedVersion = useRef<number | null>(null);
  const baseline = useRef("");
  const stored = useRef(markdown);
  const publishRef = useRef<() => void>(() => {});
  const commentsRef = useRef<NoteCommentMap>(readNoteComments(markdown || ""));
  const [comments, setComments] = useState<NoteCommentMap>(commentsRef.current);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dark = useSyncExternalStore(
    subscribeToColorScheme,
    colorSchemeSnapshot,
    colorSchemeServerSnapshot,
  );

  function noteMarkdown() {
    const marked = markedMarkdownFromBlocks(editor.document, (block) =>
      editor.blocksToMarkdownLossy([flattenWikiBlock(block)]),
    );
    return packNoteContent(marked, editor.document);
  }

  function storedMarkdown() {
    const ids = commentIds(editor.document);
    const live: NoteCommentMap = {};
    for (const [id, text] of Object.entries(commentsRef.current)) {
      if (ids.has(id)) live[id] = text;
    }
    commentsRef.current = live;
    return withNoteComments(noteMarkdown(), live);
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
    emit(storedMarkdown());
  };

  useEffect(() => {
    return bindNoteMarkdownPublisher(editor, () => publishRef.current());
  }, [editor]);

  useEffect(() => {
    return bindNoteSelectAll(editor, () => storedMarkdown());
  }, [editor]);

  useEffect(() => {
    if (appliedVersion.current === version) return;

    const first = appliedVersion.current === null;
    applying.current = true;
    const note = readNoteContent(markdown || "");
    const marked = note.blocks ? null : parseBlockMarkdown(note.markdown);
    const parsed = note.blocks
      ? note.blocks
      : marked
        ? blocksFromMarkedMarkdown(marked, (part) => editor.tryParseMarkdownToBlocks(part))
        : editor.tryParseMarkdownToBlocks(note.markdown || "");
    const blocks = linkifyWikiBlocks(parsed);
    commentsRef.current = readNoteComments(markdown || "");
    setComments(commentsRef.current);
    setEditingId(null);
    editor.replaceBlocks(editor.document, blocks as typeof editor.document);
    baseline.current = withNoteComments(noteMarkdown(), commentsRef.current);
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
    const linked = linkifyWikiBlocks(editor.document);
    if (JSON.stringify(linked) !== JSON.stringify(editor.document)) {
      applying.current = true;
      editor.replaceBlocks(editor.document, linked as typeof editor.document);
      applying.current = false;
    }
    const next = storedMarkdown();
    if (next === baseline.current) return;
    setComments(commentsRef.current);
    emit(next);
  }

  function writeComments(next: NoteCommentMap) {
    commentsRef.current = next;
    if (!ready.current || !editable) {
      setComments(next);
      return;
    }
    const packed = storedMarkdown();
    setComments(commentsRef.current);
    if (packed === baseline.current) return;
    emit(packed);
  }

  return (
    <NoteEditorFrame
      value={{
        comments,
        editingId,
        editable,
        edit: (blockId) => {
          setEditingId(blockId);
        },
        cancel: () => {
          setEditingId(null);
        },
        save: (blockId, text) => {
          setEditingId(null);
          writeComments({ ...commentsRef.current, [blockId]: text });
        },
        remove: (blockId) => {
          setEditingId(null);
          const next = { ...commentsRef.current };
          delete next[blockId];
          writeComments(next);
        },
      }}
      workspaceId={workspaceId}
    >
      <NoteEditorSurface
        editable={editable}
        editor={editor}
        onChange={handleChange}
        theme={libraryShell || dark ? "dark" : "light"}
      />
      <NoteLasso editor={editor} editable={editable} />
    </NoteEditorFrame>
  );
}
