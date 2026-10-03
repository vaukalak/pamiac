import { DocumentChildItems } from "@/components/folder/document-child-items";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documents: { id: string; title: string }[];
}

export function DocumentChildList(props: Properties) {
  const { documents } = props;
  if (documents.length === 0) return null;

  return (
    <div>
      <Paragraph>Documents</Paragraph>
      <DocumentChildItems documents={documents} />
    </div>
  );
}
