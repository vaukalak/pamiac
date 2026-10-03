import { FolderContents } from "@/components/folder/folder-contents";
import { PageTitle } from "@/ui/PageTitle";
import { Section } from "@/ui/Section";

interface Properties {
  documents: { id: string; title: string }[];
  folders: { id: string; name: string }[];
  name: string;
}

export function SharedFolderGate(props: Properties) {
  const { documents, folders, name } = props;

  return (
    <Section className="document-gate">
      <PageTitle title={name} />
      <FolderContents documents={documents} folders={folders} />
    </Section>
  );
}
