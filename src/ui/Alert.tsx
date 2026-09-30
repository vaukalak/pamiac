import type { ReactNode } from "react";

interface Properties {
  children: ReactNode;
  id?: string;
}

export function Alert(props: Properties) {
  const { children, id } = props;

  return (
    <p className="error" id={id} role="alert">
      {children}
    </p>
  );
}
