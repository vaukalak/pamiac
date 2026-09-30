import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  className?: string;
}

export function Paragraph(props: Properties) {
  const { children, className } = props;
  const classes = className ? `text-pretty ${className}` : "text-pretty";

  return <p className={classes}>{children}</p>;
}
