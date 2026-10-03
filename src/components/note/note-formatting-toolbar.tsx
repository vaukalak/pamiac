"use client";

import { FormattingToolbar, getFormattingToolbarItems } from "@blocknote/react";
import { NoteInsertBlockButton } from "@/components/note/note-insert-block-button";

export function NoteFormattingToolbar() {
  return (
    <FormattingToolbar>
      <NoteInsertBlockButton />
      {getFormattingToolbarItems()}
    </FormattingToolbar>
  );
}
