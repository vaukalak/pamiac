"use client";

import { useNoteComments } from "@/components/note/note-comments";
import { Button } from "@/ui/Button";

interface Properties {
  blockId: string;
}

export function NoteBlockCommentActions(props: Properties) {
  const { blockId } = props;
  const comments = useNoteComments();

  return (
    <div className="row-actions">
      <Button className="secondary small" onClick={() => comments.edit(blockId)} type="button">
        Edit
      </Button>
      <Button className="danger small" onClick={() => comments.remove(blockId)} type="button">
        Remove
      </Button>
    </div>
  );
}
