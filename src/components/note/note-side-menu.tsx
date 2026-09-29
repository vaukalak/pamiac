import { SideMenu, type SideMenuProps } from "@blocknote/react";
import { NoteDragHandleMenu } from "@/components/note/note-drag-handle-menu";

interface Properties {
  dragHandleMenu?: SideMenuProps["dragHandleMenu"];
}

export function NoteSideMenu(props: Properties) {
  const { dragHandleMenu = NoteDragHandleMenu } = props;

  return <SideMenu dragHandleMenu={dragHandleMenu} />;
}
