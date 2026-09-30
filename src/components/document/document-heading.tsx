import type { ReactNode } from "react";
import { DocumentHeadingCopy } from "@/components/document/document-heading-copy";

interface Properties {
  crumb: ReactNode;
  title: ReactNode;
  tools: ReactNode;
}

export function DocumentHeading(props: Properties) {
  const { crumb, title, tools } = props;

  return (
    <div className="library-heading document-heading">
      <DocumentHeadingCopy crumb={crumb} title={title} />
      {tools}
    </div>
  );
}
