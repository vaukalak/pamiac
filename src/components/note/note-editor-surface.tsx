import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { SideMenuController } from "@blocknote/react";
import { NoteSideMenu } from "@/components/note/note-side-menu";

interface Properties {
  editor: BlockNoteEditor;
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
    </BlockNoteView>
  );
}
