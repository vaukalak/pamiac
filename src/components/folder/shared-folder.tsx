import { SharedFolderGate } from "@/components/folder/shared-folder-gate";
import { Page } from "@/ui/Page";

interface Properties {
  documents: { id: string; title: string }[];
  folders: { id: string; name: string }[];
  name: string;
}

export function SharedFolder(props: Properties) {
  const { documents, folders, name } = props;

  return (
    <Page className="library-main">
      <SharedFolderGate documents={documents} folders={folders} name={name} />
    </Page>
  );
}
