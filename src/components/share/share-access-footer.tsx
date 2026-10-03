import type { ReactNode } from "react";
import { ShareActions } from "@/components/share/share-actions";

interface Properties {
  children: ReactNode;
  error: string;
  message: string;
  pending: boolean;
}

export function ShareAccessFooter(props: Properties) {
  const { children, error, message, pending } = props;

  return (
    <>
      <hr className="share-access-divider" />
      {children}
      <ShareActions error={error} message={message} pending={pending} />
    </>
  );
}
