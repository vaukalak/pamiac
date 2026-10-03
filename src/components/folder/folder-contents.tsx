import { DocumentChildList } from "@/components/folder/document-child-list";
import { FolderChildFolders } from "@/components/folder/folder-child-folders";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documents: { id: string; title: string }[];
  folders: { id: string; name: string }[];
}

export function FolderContents(props: Properties) {
  const { documents, folders } = props;
  if (folders.length === 0 && documents.length === 0) {
    return <Paragraph>This folder is empty.</Paragraph>;
  }

  return (
    <div>
      <FolderChildFolders folders={folders} />
      <DocumentChildList documents={documents} />
    </div>
  );
}
