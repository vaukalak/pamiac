"use client";

import { LockedEmail } from "@/components/document/locked-email";
import { LockedPassword } from "@/components/document/locked-password";
import { LockedSignIn } from "@/components/document/locked-sign-in";
import { Page } from "@/ui/Page";

interface Properties {
  id: string;
  nextPath?: string;
  reason: "password" | "login" | "email";
  unlockId?: string;
  unlockKind?: "document" | "folder";
}

export function LockedDocument(props: Properties) {
  const { id, nextPath, reason, unlockId = id, unlockKind = "document" } = props;
  const unlockPath =
    unlockKind === "folder"
      ? `/api/folders/${unlockId}/unlock`
      : `/api/documents/${unlockId}/unlock`;
  const description =
    unlockKind === "folder" ? "The owner protected this folder with a password." : undefined;

  return (
    <Page className="library-main">
      {reason === "password" ? (
        <LockedPassword description={description} id={unlockId} unlockPath={unlockPath} />
      ) : null}
      {reason === "login" ? <LockedSignIn id={id} nextPath={nextPath} /> : null}
      {reason === "email" ? <LockedEmail /> : null}
    </Page>
  );
}
