import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  className?: string;
}

export function Page(props: Properties) {
  const { children, className } = props;

  return <main className={className}>{children}</main>;
}
