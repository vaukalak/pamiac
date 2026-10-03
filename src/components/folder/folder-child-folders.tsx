import { FolderChildItems } from "@/components/folder/folder-child-items";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  folders: { id: string; name: string }[];
}

export function FolderChildFolders(props: Properties) {
  const { folders } = props;
  if (folders.length === 0) return null;

  return (
    <div>
      <Paragraph>Folders</Paragraph>
      <FolderChildItems folders={folders} />
    </div>
  );
}
