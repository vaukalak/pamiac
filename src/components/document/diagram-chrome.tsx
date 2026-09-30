import type { ReactNode } from "react";
import { DiagramTitle } from "@/components/document/diagram-title";
import { DocumentHeading } from "@/components/document/document-heading";

interface Properties {
  canEdit: boolean;
  crumb: ReactNode;
  id: string;
  title: string;
  tools: ReactNode;
  version: number;
}

export function DiagramChrome(props: Properties) {
  const { canEdit, crumb, id, title, tools, version } = props;

  return (
    <DocumentHeading
      crumb={crumb}
      title={<DiagramTitle canEdit={canEdit} id={id} title={title} version={version} />}
      tools={tools}
    />
  );
}
