"use client";

import { useBlockNoteEditor } from "@blocknote/react";
import { useLayoutEffect, useRef } from "react";
import { NoteBlockCommentForm } from "@/components/note/note-block-comment-form";
import { NoteBlockCommentView } from "@/components/note/note-block-comment-view";
import { useNoteComments } from "@/components/note/note-comments";

interface Properties {
  blockId: string;
  revision: number;
}

export function NoteBlockComment(props: Properties) {
  const { blockId, revision } = props;
  const comments = useNoteComments();
  const editor = useBlockNoteEditor();
  const cardRef = useRef<HTMLDivElement>(null);
  const editing = comments.editingId === blockId;
  const text = comments.comments[blockId] ?? "";

  useLayoutEffect(() => {
    const card = cardRef.current;
    const root = card?.closest(".note-editor");
    const block = document.getElementById(blockId);
    if (!card || !(root instanceof HTMLElement) || !block) return;
    const outer = block.classList.contains("bn-block-outer")
      ? block
      : block.closest(".bn-block-outer");
    if (!(outer instanceof HTMLElement)) return;

    const place = () => {
      const rootBox = root.getBoundingClientRect();
      const box = outer.getBoundingClientRect();
      card.style.width = `${box.width}px`;
      card.style.left = `${box.left - rootBox.left}px`;
      const height = card.offsetHeight || 88;
      outer.style.marginBottom = `${height + 12}px`;
      card.style.top = `${box.bottom - rootBox.top + root.scrollTop + 8}px`;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(outer);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      outer.style.marginBottom = "";
    };
  }, [blockId, editing, editor, revision, text]);

  if (!text && !editing) return null;

  return (
    <div className="note-block-comment" ref={cardRef}>
      {editing ? (
        <NoteBlockCommentForm blockId={blockId} text={text} />
      ) : (
        <NoteBlockCommentView blockId={blockId} text={text} />
      )}
    </div>
  );
}
