import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { SideMenuController } from "@blocknote/react";
import { NoteCommentLayer } from "@/components/note/note-comment-layer";
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
      onChange={onChange}
      sideMenu={false}
      theme={theme}
    >
      <SideMenuController sideMenu={NoteSideMenu} />
      <NoteCommentLayer />
      <NoteSlashMenuSheet />
      <NoteBlockMenuSheet />
    </BlockNoteView>
  );
}
