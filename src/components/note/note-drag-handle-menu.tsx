import {
  BlockColorsItem,
  DragHandleMenu,
  RemoveBlockItem,
  TableColumnHeaderItem,
  TableRowHeaderItem,
  useDictionary,
} from "@blocknote/react";
import { CopyBlockLink } from "@/components/note/copy-block-link";
import { NoteCommentMenu } from "@/components/note/note-comment-menu";
import { TurnIntoMenu } from "@/components/note/turn-into-menu";

export function NoteDragHandleMenu() {
  const dict = useDictionary();

  return (
    <DragHandleMenu>
      <TurnIntoMenu label="Turn into" />
      <CopyBlockLink label="Copy link to block" />
      <NoteCommentMenu />
      <RemoveBlockItem>{dict.drag_handle.delete_menuitem}</RemoveBlockItem>
      <BlockColorsItem>{dict.drag_handle.colors_menuitem}</BlockColorsItem>
      <TableRowHeaderItem>{dict.drag_handle.header_row_menuitem}</TableRowHeaderItem>
      <TableColumnHeaderItem>{dict.drag_handle.header_column_menuitem}</TableColumnHeaderItem>
    </DragHandleMenu>
  );
}
