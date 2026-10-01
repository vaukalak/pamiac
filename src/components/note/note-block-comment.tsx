"use client";

import { useLayoutEffect, useRef } from "react";
import { NoteBlockCommentForm } from "@/components/note/note-block-comment-form";
import { NoteBlockCommentView } from "@/components/note/note-block-comment-view";
import { useNoteComments } from "@/components/note/note-comments";
import {
  findNoteCommentBlock,
  findNoteCommentBlockInDocument,
  placeNoteBlockComment,
} from "@/lib/note-block-comment-place";

interface Properties {
  blockId: string;
  revision: number;
}

export function NoteBlockComment(props: Properties) {
  const { blockId, revision } = props;
  const comments = useNoteComments();
  const composerRef = useRef<HTMLDivElement>(null);
  const editing = comments.editingId === blockId;
  const text = comments.comments[blockId] ?? "";

  useLayoutEffect(() => {
    const node = composerRef.current;
    if (!node) return;
    const composer = node;

    let block: HTMLElement | null = null;
    const observed = new Set<Element>();
    const resize = new ResizeObserver(() => {
      place();
    });
    const mutations = new MutationObserver(() => {
      place();
    });

    function editorRoot() {
      const root = composer.closest(".note-editor");
      return root instanceof HTMLElement ? root : null;
    }

    function watchEditor(editor: Element) {
      if (observed.has(editor)) return;
      observed.add(editor);
      resize.observe(editor);
      mutations.observe(editor, {
        attributeFilter: ["data-id", "id"],
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    function place() {
      const root = editorRoot();
      if (root) watchEditor(root);
      const next = root
        ? findNoteCommentBlock(root, blockId)
        : findNoteCommentBlockInDocument(document, blockId);
      if (!next) {
        composer.classList.remove("is-placed");
        if (block) block.style.marginBottom = "";
        block = null;
        return;
      }

      if (block && block !== next) block.style.marginBottom = "";
      block = next;
      if (!observed.has(next)) {
        observed.add(next);
        resize.observe(next);
      }

      const box = next.getBoundingClientRect();
      const frame = placeNoteBlockComment(
        { bottom: box.bottom, left: box.left, width: box.width },
        composer.offsetHeight,
      );
      composer.style.left = `${frame.left}px`;
      composer.style.top = `${frame.top}px`;
      composer.style.width = `${frame.width}px`;
      next.style.marginBottom = `${frame.marginBottom}px`;
      composer.classList.add("is-placed");
    }

    const root = editorRoot();
    if (root) watchEditor(root);
    resize.observe(composer);
    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);

    return () => {
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      if (block) block.style.marginBottom = "";
    };
  }, [blockId, editing, revision, text]);

  if (!text && !editing) return null;

  return (
    <div className="note-block-comment" ref={composerRef}>
      {editing ? (
        <NoteBlockCommentForm blockId={blockId} text={text} />
      ) : (
        <NoteBlockCommentView blockId={blockId} text={text} />
      )}
    </div>
  );
}
