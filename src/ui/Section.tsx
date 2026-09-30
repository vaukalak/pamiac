import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  className?: string;
}

export function Section(props: Properties) {
  const { children, className } = props;

  return <section className={className}>{children}</section>;
}
