"use client";

import { LockedEmail } from "@/components/document/locked-email";
import { LockedPassword } from "@/components/document/locked-password";
import { LockedSignIn } from "@/components/document/locked-sign-in";
import { Page } from "@/ui/Page";

interface Properties {
  id: string;
  reason: "password" | "login" | "email";
}

export function LockedDocument(props: Properties) {
  const { id, reason } = props;

  return (
    <Page className="library-main">
      {reason === "password" ? <LockedPassword id={id} /> : null}
      {reason === "login" ? <LockedSignIn id={id} /> : null}
      {reason === "email" ? <LockedEmail /> : null}
    </Page>
  );
}
