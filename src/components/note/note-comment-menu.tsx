"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useComponentsContext, useExtensionState } from "@blocknote/react";
import { useNoteComments } from "@/components/note/note-comments";

export function NoteCommentMenu() {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor();
  const comments = useNoteComments();
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });

  if (!Components || !comments.editable || !block) return null;

  const label = comments.comments[block.id] ? "Edit comment" : "Comment";

  return (
    <Components.Generic.Menu.Item
      className="bn-menu-item"
      onClick={() => {
        comments.edit(block.id);
      }}
    >
      {label}
    </Components.Generic.Menu.Item>
  );
}
