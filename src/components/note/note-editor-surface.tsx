import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { FilePanelController, SideMenuController } from "@blocknote/react";
import { NoteBlockDrag } from "@/components/note/note-block-drag";
import { NoteCommentLayer } from "@/components/note/note-comment-layer";
import { NoteFilePanel } from "@/components/note/note-file-panel";
import { NoteFormattingToolbarController } from "@/components/note/note-formatting-toolbar-controller";
import { NoteMenuKeyboard } from "@/components/note/note-menu-keyboard";
import { NoteSideMenu } from "@/components/note/note-side-menu";
import { NoteBlockMenuSheet } from "@/components/note/note-block-menu-sheet";
import { NoteSlashMenuSheet } from "@/components/note/note-slash-menu-sheet";

interface Properties {
  editor: BlockNoteEditor<any, any, any>;
  editable: boolean;
  onChange: () => void;
  theme: "dark" | "light";
}

export function NoteEditorSurface(props: Properties) {
  const { editor, editable, onChange, theme } = props;

  return (
    <BlockNoteView
      editable={editable}
      editor={editor}
      filePanel={false}
      formattingToolbar={false}
      onChange={onChange}
      sideMenu={false}
      theme={theme}
    >
      <FilePanelController filePanel={NoteFilePanel} />
      <NoteFormattingToolbarController />
      <SideMenuController sideMenu={NoteSideMenu} />
      <NoteCommentLayer />
      <NoteSlashMenuSheet />
      <NoteBlockMenuSheet />
      <NoteMenuKeyboard />
      <NoteBlockDrag editable={editable} />
    </BlockNoteView>
  );
}
