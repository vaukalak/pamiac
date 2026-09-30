import type { ReactNode } from "react";

interface Properties {
  crumb: ReactNode;
  title: ReactNode;
}

export function DocumentHeadingCopy(props: Properties) {
  const { crumb, title } = props;

  return (
    <div className="library-heading-copy">
      {crumb}
      {title}
    </div>
  );
}
