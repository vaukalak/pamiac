import type { LibraryView } from "@/components/library/board-document";
import { FolderCardPicture } from "@/components/library/folder-card-picture";
import { FolderCardTitle } from "@/components/library/folder-card-title";

interface Properties {
  layout: LibraryView;
  name: string;
  onOpen: () => void;
}

export function FolderCardBody(props: Properties) {
  const { layout, name, onOpen } = props;

  return (
    <div className="doc-card-body">
      <FolderCardTitle name={name} onOpen={onOpen} />
      <FolderCardPicture layout={layout} />
    </div>
  );
}
