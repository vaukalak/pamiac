import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { FilePanelController, SideMenuController } from "@blocknote/react";
import { NoteCommentLayer } from "@/components/note/note-comment-layer";
import { NoteFilePanel } from "@/components/note/note-file-panel";
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
      onChange={onChange}
      sideMenu={false}
      theme={theme}
    >
      <FilePanelController filePanel={NoteFilePanel} />
      <SideMenuController sideMenu={NoteSideMenu} />
      <NoteCommentLayer />
      <NoteSlashMenuSheet />
      <NoteBlockMenuSheet />
    </BlockNoteView>
  );
}
