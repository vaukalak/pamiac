"use client";

import { useBlockNoteEditor } from "@blocknote/react";
import { useEffect, useState } from "react";
import { NoteBlockComment } from "@/components/note/note-block-comment";
import { useNoteComments } from "@/components/note/note-comments";

function blockIds(blocks: readonly { id: string; children?: readonly { id: string }[] }[]) {
  const ids: string[] = [];
  for (const block of blocks) {
    ids.push(block.id);
    if (block.children) ids.push(...blockIds(block.children));
  }
  return ids;
}

export function NoteCommentLayer() {
  const editor = useBlockNoteEditor();
  const comments = useNoteComments();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return editor.onChange(() => {
      setRevision((value) => value + 1);
    });
  }, [editor]);

  const ids = new Set(blockIds(editor.document));
  if (comments.editingId) ids.add(comments.editingId);
  for (const id of Object.keys(comments.comments)) ids.add(id);
  const visible = [...ids].filter((id) => comments.comments[id] || comments.editingId === id);

  return (
    <div className="note-comment-layer">
      {visible.map((id) => (
        <NoteBlockComment blockId={id} key={id} revision={revision} />
      ))}
    </div>
  );
}
