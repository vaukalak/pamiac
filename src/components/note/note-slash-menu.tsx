"use client";

import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useBlockNoteEditor,
} from "@blocknote/react";
import { useState } from "react";
import { NotePagePicker } from "@/components/note/note-page-picker";
import { pageSlashMenuItem } from "@/lib/note-page";

export function NoteSlashMenu() {
  const editor = useBlockNoteEditor();
  const [blockId, setBlockId] = useState<string | null>(null);

  return (
    <>
      <SuggestionMenuController
        getItems={async (query) =>
          filterSuggestionItems(
            [
              ...getDefaultReactSlashMenuItems(editor),
              {
                ...pageSlashMenuItem(() => {
                  setBlockId(editor.getTextCursorPosition().block.id);
                }),
                icon: (
                  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
                    <path
                      d="M5 3.5h5.2L14 7.2V14.5H5v-11Z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M10 3.5V7.5H14"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                ),
              },
            ],
            query,
          )
        }
        triggerCharacter="/"
      />
      {blockId ? <NotePagePicker blockId={blockId} onClose={() => setBlockId(null)} /> : null}
    </>
  );
}
