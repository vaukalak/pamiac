"use client";

import { NoteBlockCommentActions } from "@/components/note/note-block-comment-actions";
import { useNoteComments } from "@/components/note/note-comments";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  blockId: string;
  text: string;
}

export function NoteBlockCommentView(props: Properties) {
  const { blockId, text } = props;
  const comments = useNoteComments();

  return (
    <aside className="note-block-comment-card">
      <Paragraph>{text}</Paragraph>
      {comments.editable ? <NoteBlockCommentActions blockId={blockId} /> : null}
    </aside>
  );
}
