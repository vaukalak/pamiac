import type { LibraryView } from "@/components/library/board-document";
import { FolderIcon } from "@/components/library/folder-icon";

interface Properties {
  layout: LibraryView;
}

export function FolderCardPicture(props: Properties) {
  const { layout } = props;
  if (layout === "list") return null;

  return (
    <div className="folder-picture">
      <FolderIcon size="picture" />
    </div>
  );
}
