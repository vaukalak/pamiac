import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
}

export function Status(props: Properties) {
  const { children } = props;

  return <p className="hint status">{children}</p>;
}
