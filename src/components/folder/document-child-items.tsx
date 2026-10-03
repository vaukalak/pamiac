import { DocumentChild } from "@/components/folder/document-child";

interface Properties {
  documents: { id: string; title: string }[];
}

export function DocumentChildItems(props: Properties) {
  const { documents } = props;

  return (
    <ul className="folder-child-list">
      {documents.map((document) => (
        <DocumentChild id={document.id} key={document.id} title={document.title} />
      ))}
    </ul>
  );
}
