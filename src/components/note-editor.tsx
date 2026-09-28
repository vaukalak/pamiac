"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef } from "react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

export function NoteEditor({
  initial,
  editable,
  onChange,
}: {
  initial: string;
  editable: boolean;
  onChange: (markdown: string) => void;
}) {
  const editor = useCreateBlockNote();
  const ready = useRef(false);

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
        onChange={() => {
          if (!ready.current || !editable) return;
          onChange(editor.blocksToMarkdownLossy(editor.document));
        }}
      />
    </div>
  );
}
