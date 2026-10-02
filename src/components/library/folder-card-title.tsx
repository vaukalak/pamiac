import { FolderCardName } from "@/components/library/folder-card-name";
import { FolderIcon } from "@/components/library/folder-icon";

interface Properties {
  name: string;
  onOpen: () => void;
}

export function FolderCardTitle(props: Properties) {
  const { name, onOpen } = props;

  return (
    <div className="doc-card-title">
      <FolderIcon size="title" />
      <FolderCardName name={name} onOpen={onOpen} />
    </div>
  );
}
