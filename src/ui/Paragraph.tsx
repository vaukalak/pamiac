import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Paragraph(props: Properties) {
  const { children, className, id } = props;
  const classes = className ? `text-pretty ${className}` : "text-pretty";

  return (
    <p className={classes} id={id}>
      {children}
    </p>
  );
}
