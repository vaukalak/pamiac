"use client";

import { SuggestionMenu } from "@blocknote/core/extensions";
import {
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useExtension,
} from "@blocknote/react";
import { useSyncExternalStore } from "react";
import { hideSoftwareKeyboard } from "@/lib/note-menu-keyboard";
import {
  narrowNoteServerSnapshot,
  narrowNoteSnapshot,
  subscribeNarrowNote,
} from "@/lib/note-narrow";

export function NoteInsertBlockButton() {
  const Components = useComponentsContext();
  const dict = useDictionary();
  const editor = useBlockNoteEditor();
  const suggestionMenu = useExtension(SuggestionMenu);
  const narrow = useSyncExternalStore(
    subscribeNarrowNote,
    narrowNoteSnapshot,
    narrowNoteServerSnapshot,
  );

  if (!Components || !narrow) return null;

  const insertBlock = () => {
    const block = editor.getTextCursorPosition().block;
    const content = block.content;
    const empty = content !== undefined && Array.isArray(content) && content.length === 0;
    const target = empty ? block : editor.insertBlocks([{ type: "paragraph" }], block, "after")[0];

    if (!target) return;

    editor.prosemirrorView.dom.setAttribute("inputmode", "none");
    hideSoftwareKeyboard();
    editor.setTextCursorPosition(target);
    suggestionMenu.openSuggestionMenu("/");
    if (!suggestionMenu.shown()) editor.prosemirrorView.dom.removeAttribute("inputmode");
  };

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      icon={
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path d="M9 3v12M3 9h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      }
      label={dict.side_menu.add_block_label}
      mainTooltip={dict.side_menu.add_block_label}
      onClick={insertBlock}
    />
  );
}
